from app.services.email_service import send_email
from app.tasks.celery_app import celery_app


@celery_app.task
def send_email_task(to: str, subject: str, html: str) -> bool:
    import asyncio

    return asyncio.run(send_email(to, subject, html))
