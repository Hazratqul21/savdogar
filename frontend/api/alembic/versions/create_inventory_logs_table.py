"""create_inventory_logs_table

Revision ID: create_inventory_logs
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'create_inventory_logs'
down_revision = None  # Update this to your latest migration
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'inventory_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=False),
        sa.Column('scan_mode', sa.String(), nullable=False),
        sa.Column('model_used', sa.String(), nullable=False),
        sa.Column('items_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('items_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('status', sa.String(), server_default='pending', nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('imported_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_logs_id'), 'inventory_logs', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_logs_user_id'), 'inventory_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_inventory_logs_tenant_id'), 'inventory_logs', ['tenant_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_inventory_logs_tenant_id'), table_name='inventory_logs')
    op.drop_index(op.f('ix_inventory_logs_user_id'), table_name='inventory_logs')
    op.drop_index(op.f('ix_inventory_logs_id'), table_name='inventory_logs')
    op.drop_table('inventory_logs')
