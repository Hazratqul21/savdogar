"""Audit Inventory V2 Migration

Revision ID: audit_inventory_v2
Revises: add_onboarding_001, add_subscription_columns, add_super_admin_rls, add_tobacco_business_type, create_inventory_logs
Create Date: 2026-01-20 04:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'audit_inventory_v2'
down_revision: Union[str, Sequence[str], None] = (
    'add_onboarding_001', 
    'add_subscription_columns', 
    'add_super_admin_rls', 
    'add_tobacco_business_type', 
    'create_inventory_logs'
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add tenant_id to inventory_movements
    op.add_column('inventory_movements', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_inv_movements_tenant', 'inventory_movements', 'tenants', ['tenant_id'], ['id'])
    op.create_index(op.f('ix_inventory_movements_tenant_id'), 'inventory_movements', ['tenant_id'], unique=False)

    # 2. Add variant_id to inventory_movements
    op.add_column('inventory_movements', sa.Column('variant_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_inv_movements_variant', 'inventory_movements', 'product_variants', ['variant_id'], ['id'])
    op.create_index(op.f('ix_inventory_movements_variant_id'), 'inventory_movements', ['variant_id'], unique=False)

    # 3. Make product_id nullable for legacy support
    op.alter_column('inventory_movements', 'product_id',
               existing_type=sa.INTEGER(),
               nullable=True)


def downgrade() -> None:
    # 1. Revert product_id to nullable=False
    op.alter_column('inventory_movements', 'product_id',
               existing_type=sa.INTEGER(),
               nullable=False)

    # 2. Remove columns
    op.drop_index(op.f('ix_inventory_movements_variant_id'), table_name='inventory_movements')
    op.drop_column('inventory_movements', 'variant_id')
    op.drop_index(op.f('ix_inventory_movements_tenant_id'), table_name='inventory_movements')
    op.drop_column('inventory_movements', 'tenant_id')
