"""merge_all_heads

Revision ID: a512d1c7a093
Revises: 58d694ffff18, add_double_entry_inv
Create Date: 2026-01-04 19:03:28.379825

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a512d1c7a093'
down_revision: Union[str, Sequence[str], None] = 'add_double_entry_inv'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
