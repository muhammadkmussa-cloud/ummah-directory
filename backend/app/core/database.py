from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool, QueuePool

from app.core.config import settings

if settings.app_env == "test":
    engine = create_async_engine(settings.database_url, echo=settings.app_debug, poolclass=NullPool)
else:
    engine = create_async_engine(
        settings.database_url,
        echo=settings.app_debug,
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        pool_recycle=settings.db_pool_recycle,
        pool_timeout=settings.db_pool_timeout,
        pool_pre_ping=settings.db_pool_pre_ping,
    )
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


from sqlalchemy import event
from sqlalchemy.orm import DeclarativeBase, Session, with_loader_criteria


class Base(DeclarativeBase):
    pass


@event.listens_for(Session, "do_orm_execute")
def _add_filtering_criteria(execute_state):
    if (
        execute_state.is_select
        and not execute_state.is_column_load
        and not execute_state.is_relationship_load
    ):
        execute_state.statement = execute_state.statement.options(
            with_loader_criteria(
                Base,
                lambda cls: cls.deleted_at.is_(None) if hasattr(cls, "deleted_at") else True,
                include_aliases=True,
            )
        )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
