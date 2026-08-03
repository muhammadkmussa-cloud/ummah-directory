"""remove_messages_feature

Revision ID: 3a6e3d5e2d1f
Revises: 21a8bf1a7ba5
Create Date: 2026-07-24 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3a6e3d5e2d1f'
down_revision: Union[str, None] = '21a8bf1a7ba5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('DROP INDEX IF EXISTS ix_msg_conv_id')
    op.execute('DROP TABLE IF EXISTS messages CASCADE')
    op.execute('DROP TABLE IF EXISTS conversations CASCADE')


def downgrade() -> None:
    pass
