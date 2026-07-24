from datetime import UTC, datetime

from app.tasks.celery_app import celery_app


@celery_app.task
def expire_premier_listings():
    import asyncio

    from sqlalchemy import update

    from app.core.database import async_session_factory
    from app.models.business import Business

    async def run():
        async with async_session_factory() as session:
            now = datetime.now(UTC).isoformat()
            await session.execute(
                update(Business)
                .where(Business.is_premier, Business.premier_expires_at < now)
                .values(is_premier=False, premier_expires_at=None)
            )
            await session.commit()
    asyncio.run(run())


@celery_app.task
def archive_old_events():
    import asyncio

    from sqlalchemy import update

    from app.core.database import async_session_factory
    from app.models.event import Event

    async def run():
        async with async_session_factory() as session:
            now = datetime.now(UTC).strftime("%Y-%m-%d")
            await session.execute(
                update(Event)
                .where(Event.status == "published", Event.event_date < now)
                .values(status="archived")
            )
            await session.commit()
    asyncio.run(run())


@celery_app.task
def cleanup_expired_tokens():
    pass


@celery_app.task
def activate_expire_ads():
    import asyncio

    from sqlalchemy import update

    from app.core.database import async_session_factory
    from app.models.advertisement import Advertisement

    async def run():
        async with async_session_factory() as session:
            now = datetime.now(UTC).isoformat()
            await session.execute(
                update(Advertisement)
                .where(Advertisement.status == "approved", Advertisement.start_date <= now)
                .values(is_active=True)
            )
            await session.execute(
                update(Advertisement)
                .where(Advertisement.is_active, Advertisement.end_date <= now)
                .values(is_active=False)
            )
            await session.commit()
    asyncio.run(run())


@celery_app.task
def send_event_reminders():
    import asyncio
    from datetime import timedelta

    from sqlalchemy import select

    from app.core.database import async_session_factory
    from app.models.event import Event, SavedEvent
    from app.models.notification import Notification

    async def run():
        async with async_session_factory() as session:
            now = datetime.now(UTC)
            window_start = now + timedelta(hours=23)
            window_end = now + timedelta(hours=25)
            events = await session.execute(
                select(Event).where(
                    Event.status == "published",
                    Event.event_date >= window_start,
                    Event.event_date <= window_end,
                    Event.deleted_at.is_(None),
                )
            )
            for event in events.scalars().all():
                saved_result = await session.execute(
                    select(SavedEvent).where(SavedEvent.event_id == event.id)
                )
                for saved in saved_result.scalars().all():
                    existing = await session.execute(
                        select(Notification).where(
                            Notification.user_id == saved.user_id,
                            Notification.type == "event_reminder",
                            Notification.data['event_id'].as_string() == str(event.id),
                        )
                    )
                    if not existing.scalar_one_or_none():
                        notif = Notification(
                            user_id=saved.user_id,
                            type="event_reminder",
                            title=f"Reminder: {event.title} starts soon!",
                            message=f"Your saved event '{event.title}' is starting {event.event_time or 'soon'} at {event.venue or 'the venue'}.",
                            data={"event_id": str(event.id), "event_title": event.title},
                        )
                        session.add(notif)
            await session.commit()
    asyncio.run(run())


@celery_app.task
def notify_prayer_time_changes():
    import asyncio

    from sqlalchemy import select

    from app.core.database import async_session_factory
    from app.models.mosque import Mosque
    from app.models.notification import Notification

    async def run():
        async with async_session_factory() as session:
            from app.models.prayer_subscription import MosquePrayerSubscription
            subs = await session.execute(
                select(MosquePrayerSubscription).where(MosquePrayerSubscription.is_active)
            )
            for sub in subs.scalars().all():
                mosque_result = await session.execute(
                    select(Mosque).where(Mosque.id == sub.mosque_id)
                )
                mosque = mosque_result.scalar_one_or_none()
                if mosque and mosque.prayer_times:
                    notif = Notification(
                        user_id=sub.user_id,
                        type="prayer_time_update",
                        title=f"Prayer times updated for {mosque.name}",
                        message="The prayer times have been updated. Check the mosque page for details.",
                        data={"mosque_id": str(mosque.id), "mosque_name": mosque.name},
                    )
                    session.add(notif)
            await session.commit()
    asyncio.run(run())
