from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationPreference
from app.models.user import User
from app.services.email_service import send_email
from app.services.push_service import send_to_user


async def create_notification(
    db: AsyncSession,
    user_id: str,
    type: str,
    title: str,
    message: str | None = None,
    data: dict | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        data=data,
    )
    db.add(notif)
    await db.flush()

    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == user_id)
    )
    prefs = result.scalar_one_or_none()

    if prefs and prefs.push_notifications:
        # Push channel (workflows.md #25). No-op if Web Push isn't configured.
        await send_to_user(
            db,
            user_id,
            {"type": type, "title": title, "body": message or "", "data": data or {}},
        )

    if prefs and prefs.email_notifications:
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if user and user.email:
            await send_email(
                to=user.email,
                subject=title,
                html=message or "",
            )
    return notif
