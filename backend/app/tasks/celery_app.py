from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "umma",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.email_tasks", "app.tasks.cleanup_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Africa/Nairobi",
    enable_utc=True,
    beat_schedule={
        "expire-premier-listings": {
            "task": "app.tasks.cleanup_tasks.expire_premier_listings",
            "schedule": 86400.0,
        },
        "archive-old-events": {
            "task": "app.tasks.cleanup_tasks.archive_old_events",
            "schedule": 43200.0,
        },
        "cleanup-expired-tokens": {
            "task": "app.tasks.cleanup_tasks.cleanup_expired_tokens",
            "schedule": 3600.0,
        },
        "activate-expire-ads": {
            "task": "app.tasks.cleanup_tasks.activate_expire_ads",
            "schedule": 3600.0,
        },
        "notify-prayer-time-changes": {
            "task": "app.tasks.cleanup_tasks.notify_prayer_time_changes",
            "schedule": 86400.0,
        },
        "send-event-reminders": {
            "task": "app.tasks.cleanup_tasks.send_event_reminders",
            "schedule": 3600.0,
        },
    },
)
