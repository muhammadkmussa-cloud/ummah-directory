import io
import uuid
from pathlib import PurePosixPath

import boto3
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_client_info, get_current_user
from app.core.rate_limit import limiter
from app.models.media import MediaFile
from app.models.user import User
from app.services.audit_service import log_action

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
ALLOWED_RESOURCE_TYPES = {
    "business",
    "mosque",
    "charity",
    "education",
    "profile",
    "general",
    "verification",
}
MAX_SIZE = 10 * 1024 * 1024
MAX_IMAGE_DIMENSION = 2048
MAX_IMAGE_PIXELS = 50_000_000
THUMBNAIL_SIZE = (400, 400)

MAGIC_BYTES: dict[str, bytes] = {
    "image/jpeg": b"\xff\xd8\xff",
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/webp": b"RIFF",
    "application/pdf": b"%PDF",
}


def validate_file_signature(content: bytes, mime_type: str) -> bool:
    magic = MAGIC_BYTES.get(mime_type)
    if not magic:
        return False
    return content.startswith(magic)


def optimize_image(content: bytes, mime_type: str) -> bytes:
    img: Image.Image = Image.open(io.BytesIO(content))
    if img.size[0] * img.size[1] > MAX_IMAGE_PIXELS:
        raise HTTPException(status_code=400, detail="Image resolution too high")
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    if max(img.size) > MAX_IMAGE_DIMENSION:
        img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.Resampling.LANCZOS)
    output = io.BytesIO()
    save_kwargs: dict = {"format": img.format or "JPEG"}
    if img.format == "JPEG" or mime_type == "image/jpeg":
        save_kwargs["quality"] = 85
        save_kwargs["optimize"] = True
    elif img.format == "PNG" or mime_type == "image/png":
        save_kwargs["optimize"] = True
    elif img.format == "WEBP" or mime_type == "image/webp":
        save_kwargs["quality"] = 80
    img.save(output, **save_kwargs)
    return output.getvalue()


def generate_thumbnail(content: bytes, mime_type: str) -> bytes | None:
    if not mime_type.startswith("image/"):
        return None
    try:
        img: Image.Image = Image.open(io.BytesIO(content))
        img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        output = io.BytesIO()
        img.save(output, format="JPEG", quality=70, optimize=True)
        return output.getvalue()
    except Exception:
        return None


async def upload_to_s3(file_bytes: bytes, filename: str, content_type: str) -> str:
    if not settings.s3_endpoint:
        raise HTTPException(status_code=500, detail="Storage not configured")

    client = boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
        region_name=settings.s3_region,
    )

    safe_name = PurePosixPath(filename).name
    key = f"uploads/{uuid.uuid4().hex}/{safe_name}"
    client.put_object(
        Bucket=settings.s3_bucket_name,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )
    return f"{settings.s3_endpoint}/{settings.s3_bucket_name}/{key}"


@router.post("/upload")
@limiter.limit("10/minute")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    resource_type: str = Form("general"),
    resource_id: str | None = Form(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if resource_type not in ALLOWED_RESOURCE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid resource type. Must be one of: {ALLOWED_RESOURCE_TYPES}",
        )
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")

    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    if not validate_file_signature(contents, file.content_type or "application/octet-stream"):
        raise HTTPException(status_code=400, detail="File content does not match declared type")

    is_image = file.content_type and file.content_type.startswith("image/")
    thumbnail_url = None
    if is_image:
        contents = optimize_image(contents, file.content_type)
        thumbnail_bytes = generate_thumbnail(contents, file.content_type)
        if thumbnail_bytes:
            thumb_name = f"thumb_{file.filename or 'image'}"
            thumbnail_url = await upload_to_s3(thumbnail_bytes, thumb_name, "image/jpeg")

    url = await upload_to_s3(
        contents, file.filename or "file", file.content_type or "application/octet-stream"
    )

    media = MediaFile(
        file_type="image" if is_image else "document",
        file_url=url,
        thumbnail_url=thumbnail_url,
        file_size=len(contents),
        mime_type=file.content_type,
        resource_type=resource_type,
        resource_id=resource_id or user.id,
        user_id=user.id,
    )
    db.add(media)
    await db.flush()
    ip, ua = get_client_info(None)
    await log_action(
        db, user.id, "file.upload", "media", str(media.id), ip_address=ip, user_agent=ua
    )

    return {
        "id": str(media.id),
        "url": url,
        "file_type": media.file_type,
    }
