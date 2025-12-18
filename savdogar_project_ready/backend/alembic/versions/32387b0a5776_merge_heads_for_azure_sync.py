"""Merge heads for Azure sync

Revision ID: 32387b0a5776
Revises: 69ac33912f1c, b2c3d4e5f6g7
Create Date: 2025-12-19 01:39:22.490420

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '32387b0a5776'
down_revision: Union[str, Sequence[str], None] = ('69ac33912f1c', 'b2c3d4e5f6g7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
