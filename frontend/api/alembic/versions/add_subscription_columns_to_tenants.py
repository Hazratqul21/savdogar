"""add_subscription_columns_to_tenants

Revision ID: add_subscription_columns
Revises: a512d1c7a093
Create Date: 2025-01-09 16:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from datetime import datetime, timedelta


# revision identifiers, used by Alembic.
revision: str = 'add_subscription_columns'
down_revision: Union[str, Sequence[str], None] = 'a512d1c7a093'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add subscription plan columns to tenants table."""
    
    # Add subscription_plan column (default: 'trial')
    op.add_column('tenants', sa.Column('subscription_plan', sa.String(), nullable=True, server_default='trial'))
    
    # Add trial_ends_at column (default: now() + 1 month)
    op.add_column('tenants', sa.Column('trial_ends_at', sa.DateTime(), nullable=True))
    
    # Add max_users column (default: 5 for standard, 25 for pro, 5 for trial)
    op.add_column('tenants', sa.Column('max_users', sa.Integer(), nullable=True, server_default='5'))
    
    # Add max_branches column (default: 1 for standard, 5 for pro, 1 for trial)
    op.add_column('tenants', sa.Column('max_branches', sa.Integer(), nullable=True, server_default='1'))
    
    # Set default trial_ends_at for existing tenants (now + 1 month)
    op.execute("""
        UPDATE tenants 
        SET trial_ends_at = NOW() + INTERVAL '1 month'
        WHERE trial_ends_at IS NULL
    """)


def downgrade() -> None:
    """Remove subscription columns from tenants table."""
    op.drop_column('tenants', 'max_branches')
    op.drop_column('tenants', 'max_users')
    op.drop_column('tenants', 'trial_ends_at')
    op.drop_column('tenants', 'subscription_plan')
