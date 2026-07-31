from app.schemas.common import MessageResponse
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi import Header as HeaderParam
from sqlalchemy import cast, select, String, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.donation import Donation
from app.models.payment import Payment
from app.models.saved_payment_method import SavedPaymentMethod
from app.models.user import User
from app.payments import get_gateway
from app.schemas.payment import PaymentIntentRequest, PaymentIntentResponse
from app.services.audit_service import log_action
from app.services.payment_service import PaymentService

router = APIRouter()


@router.post("/create-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    req: PaymentIntentRequest,
    idempotency_key: str | None = HeaderParam(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if idempotency_key:
        existing = await db.execute(
            select(Payment).where(
                Payment.gateway == req.gateway,
                Payment.gateway_response.isnot(None),
                or_(
                    cast(Payment.gateway_response["idempotency_key"], String) == idempotency_key,
                    Payment.gateway_response["idempotency_key"].as_string() == idempotency_key,
                ),
            )
        )
        existing_payment = existing.scalar_one_or_none()
        if existing_payment:
            return {
                "payment_id": str(existing_payment.id),
                "gateway_payment_id": existing_payment.gateway_payment_id,
                "status": existing_payment.status,
            }
    try:
        gw = await PaymentService.get_configured_gateway(db, req.gateway)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unsupported gateway: {req.gateway}")

    intent = await gw.create_payment(Decimal(str(req.amount)), req.currency, req.metadata)

    payment = Payment(
        amount=Decimal(str(req.amount)),
        currency=req.currency,
        gateway=req.gateway,
        gateway_payment_id=intent.gateway_payment_id,
        status="pending",
        gateway_response=req.metadata,
        reference_type=req.reference_type,
        reference_id=req.reference_id,
        user_id=user.id,
    )
    db.add(payment)
    await db.flush()
    await log_action(db, user.id, "payment.create", "payment", str(payment.id))

    return {
        "payment_id": str(payment.id),
        "gateway_payment_id": intent.gateway_payment_id,
        "client_secret": intent.client_secret,
        "approval_url": intent.approval_url,
        "status": intent.status,
    }


@router.get("/{id}")
async def get_payment(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Payment).where(Payment.id == id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if str(payment.user_id) != str(user.id) and user.role.name not in ["super_admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Not your payment")
        
    return {
        "id": str(payment.id),
        "amount": float(payment.amount),
        "currency": payment.currency,
        "gateway": payment.gateway,
        "status": payment.status,
        "reference_type": payment.reference_type,
        "reference_id": payment.reference_id,
        "created_at": payment.created_at,
    }

@router.post("/{gateway}/webhook")
async def payment_webhook(
    gateway: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    try:
        gw = await PaymentService.get_configured_gateway(db, gateway)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unsupported gateway: {gateway}")

    payload = await request.body()
    headers = dict(request.headers)

    event = await gw.verify_webhook(payload, headers)
    if not event:
        return {"status": "ignored"}
        
    from app.core.cache import get_redis
    redis = await get_redis()
    event_cache_key = f"webhook_event:{gateway}:{event.event_id}"
    
    # Try to set the key. If it exists (returns False/0), it's a replay.
    # Expiry is set to 7 days (604800 seconds) to match typical retry windows
    if not await redis.set(event_cache_key, "1", nx=True, ex=604800):
        return {"status": "already_processed"}

    result = await db.execute(
        select(Payment).where(Payment.gateway_payment_id == event.gateway_payment_id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        return {"status": "payment_not_found"}

    payment.status = event.status
    if event.type == "payment.succeeded" and event.metadata:
        payment.gateway_response = {**(payment.gateway_response or {}), **event.metadata}

    await log_action(
        db, payment.user_id, f"payment.{event.status}", "payment", str(payment.id),
        details={"gateway": gateway, "event": event.type},
    )
    return {"status": "processed"}


@router.post("/{id}/refund")
async def refund_payment(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Payment).where(Payment.id == id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if str(payment.user_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Not your payment")

    if payment.status != "succeeded":
        raise HTTPException(status_code=400, detail="Only succeeded payments can be refunded")

    if payment.is_refunded:
        raise HTTPException(status_code=400, detail="Payment has already been refunded")

    donation_result = await db.execute(
        select(Donation).where(Donation.payment_id == payment.id, Donation.status == "completed")
    )
    donation = donation_result.scalar_one_or_none()
    if donation:
        raise HTTPException(
            status_code=400,
            detail="Cannot refund a payment linked to a completed donation. Contact support.",
        )

    if not payment.gateway_payment_id:
        raise HTTPException(status_code=400, detail="Payment has no gateway transaction ID")
    gw = await PaymentService.get_configured_gateway(db, payment.gateway)
    success = await gw.refund(payment.gateway_payment_id)

    if success:
        payment.is_refunded = True
        payment.refunded_amount = payment.amount
        await log_action(db, user.id, "payment.refund", "payment", id)

    return {"success": success}


@router.get("/{id}/invoice", response_model=None)
async def download_invoice(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from fastapi.responses import Response

    result = await db.execute(select(Payment).where(Payment.id == id))
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if str(payment.user_id) != str(user.id) and user.role.name not in ["super_admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Not your payment")
    if payment.status != "succeeded":
        raise HTTPException(status_code=400, detail="Only succeeded payments have invoices")

    # Generate PDF invoice
    from fpdf import FPDF
    from datetime import datetime

    ref_type_map = {
        "premier_subscription": "Premier Subscription",
        "ad_campaign": "Ad Campaign",
        "donation": "Donation",
        "featured_listing": "Featured Listing",
    }
    ref_key = payment.reference_type or ""
    ref_label = ref_type_map.get(ref_key, ref_key or "Payment")

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 22)
    pdf.cell(0, 14, "INVOICE", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, "Umma Directory - ummadirectory.com", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(12)

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(60, 7, "Invoice Number:", new_x="RIGHT")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 7, f"INV-{str(payment.id)[:8].upper()}", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(60, 7, "Date:", new_x="RIGHT")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 7, payment.created_at.strftime("%Y-%m-%d") if payment.created_at else "N/A", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(60, 7, "Payment Method:", new_x="RIGHT")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 7, payment.gateway.replace("_", " ").title() if payment.gateway else "N/A", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(60, 7, "Description:", new_x="RIGHT")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 7, ref_label, new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(60, 7, "Status:", new_x="RIGHT")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 7, payment.status.title(), new_x="LMARGIN", new_y="NEXT")

    pdf.ln(8)
    pdf.set_draw_color(0)
    pdf.set_line_width(0.4)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(8)

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, f"Total: {float(payment.amount):,.2f} {payment.currency}", align="R", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(12)

    pdf.set_font("Helvetica", "I", 9)
    pdf.cell(0, 5, "Thank you for your business.", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 5, "This invoice is auto-generated by Umma Directory.", align="C", new_x="LMARGIN", new_y="NEXT")

    pdf_bytes = bytes(pdf.output())
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="invoice-{str(payment.id)[:8]}.pdf"'},
    )


# --- Saved Payment Methods ---

@router.get("/methods")
async def list_saved_methods(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavedPaymentMethod)
        .where(SavedPaymentMethod.user_id == user.id, SavedPaymentMethod.deleted_at.is_(None))
        .order_by(SavedPaymentMethod.is_default.desc(), SavedPaymentMethod.created_at.desc())
    )
    return [{
        "id": str(m.id),
        "gateway": m.gateway,
        "last_four": m.last_four,
        "card_brand": m.card_brand,
        "is_default": m.is_default,
        "expires_at": m.expires_at,
        "created_at": m.created_at,
    } for m in result.scalars().all()]


@router.post("/methods", response_model=None)
async def save_payment_method(
    gateway: str,
    gateway_payment_method_id: str,
    last_four: str | None = None,
    card_brand: str | None = None,
    expires_at: str | None = None,
    set_default: bool = False,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if gateway not in ("stripe", "paypal"):
        raise HTTPException(status_code=400, detail="Unsupported gateway")

    existing = await db.execute(
        select(SavedPaymentMethod).where(
            SavedPaymentMethod.user_id == user.id,
            SavedPaymentMethod.gateway_payment_method_id == gateway_payment_method_id,
            SavedPaymentMethod.deleted_at.is_(None),
        )
    )
    if existing.scalar_one_or_none():
        return {"message": "Payment method already saved"}

    if set_default:
        await db.execute(
            select(SavedPaymentMethod).where(
                SavedPaymentMethod.user_id == user.id, SavedPaymentMethod.is_default
            )
        )
        defaults = (await db.execute(
            select(SavedPaymentMethod).where(
                SavedPaymentMethod.user_id == user.id, SavedPaymentMethod.is_default
            )
        )).scalars().all()
        for d in defaults:
            d.is_default = False

    method = SavedPaymentMethod(
        gateway=gateway,
        gateway_payment_method_id=gateway_payment_method_id,
        last_four=last_four,
        card_brand=card_brand,
        expires_at=expires_at,
        is_default=set_default or not await db.scalar(
            select(SavedPaymentMethod).where(SavedPaymentMethod.user_id == user.id, SavedPaymentMethod.deleted_at.is_(None))
        ),
        user_id=user.id,
    )
    db.add(method)
    await db.flush()
    return {"id": str(method.id), "message": "Payment method saved"}


@router.delete("/methods/{id}", response_model=MessageResponse)
async def delete_saved_method(
    id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavedPaymentMethod).where(
            SavedPaymentMethod.id == id,
            SavedPaymentMethod.user_id == user.id,
            SavedPaymentMethod.deleted_at.is_(None),
        )
    )
    method = result.scalar_one_or_none()
    if not method:
        raise HTTPException(status_code=404, detail="Payment method not found")

    method.soft_delete()
    return {"message": "Payment method removed"}
