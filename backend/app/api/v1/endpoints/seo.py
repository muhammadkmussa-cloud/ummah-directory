from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.business import Business
from app.models.charity import Charity
from app.models.education import EducationalInstitution
from app.models.event import Event
from app.models.mosque import Mosque

router = APIRouter()


@router.get("/robots.txt", response_class=PlainTextResponse, include_in_schema=False)
async def robots_txt():
    return """User-agent: *
Allow: /
Sitemap: https://ummadirectory.com/sitemap.xml
"""


@router.get("/sitemap.xml", response_class=Response, include_in_schema=False)
async def sitemap_xml(db: AsyncSession = Depends(get_db)):
    urls = [
        {"loc": "https://ummadirectory.com/", "priority": "1.0"},
        {"loc": "https://ummadirectory.com/businesses", "priority": "0.9"},
        {"loc": "https://ummadirectory.com/mosques", "priority": "0.9"},
        {"loc": "https://ummadirectory.com/charities", "priority": "0.9"},
        {"loc": "https://ummadirectory.com/events", "priority": "0.8"},
        {"loc": "https://ummadirectory.com/education", "priority": "0.8"},
    ]

    for model, prefix in [
        (Business, "businesses"),
        (Mosque, "mosques"),
        (Charity, "charities"),
        (EducationalInstitution, "education"),
    ]:
        result = await db.execute(select(model.slug).where(model.status.in_(["approved", "published"])))
        for slug in result.scalars().all():
            urls.append({"loc": f"https://ummadirectory.com/{prefix}/{slug}", "priority": "0.6"})

    result = await db.execute(select(Event.slug).where(Event.status == "published"))
    for slug in result.scalars().all():
        urls.append({"loc": f"https://ummadirectory.com/events/{slug}", "priority": "0.5"})

    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for url in urls:
        xml += f'  <url><loc>{url["loc"]}</loc><priority>{url["priority"]}</priority></url>\n'
    xml += "</urlset>"

    return Response(content=xml, media_type="application/xml")
