"""add onboarding columns to tenants

Revision ID: add_onboarding_001
Revises: 32387b0a5776
Create Date: 2026-01-11

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_onboarding_001'
down_revision = '32387b0a5776'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add onboarding columns to tenants table
    op.add_column('tenants', sa.Column('onboarding_completed', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('tenants', sa.Column('onboarding_step', sa.Integer(), nullable=True, server_default='0'))
    
    # Create index on onboarding_completed for faster queries
    op.create_index(op.f('ix_tenants_onboarding_completed'), 'tenants', ['onboarding_completed'], unique=False)
    
    # Update existing tenants to have onboarding completed (since they're already active)
    op.execute("UPDATE tenants SET onboarding_completed = true WHERE onboarding_completed IS NULL")


def downgrade() -> None:
    op.drop_index(op.f('ix_tenants_onboarding_completed'), table_name='tenants')
    op.drop_column('tenants', 'onboarding_step')
    op.drop_column('tenants', 'onboarding_completed')
