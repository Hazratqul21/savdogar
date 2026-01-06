"""Add Plumbing & HVAC features

Revision ID: add_plumbing_hvac
Revises: 
Create Date: 2024-12-XX

✅ PART 2: Plumbing & HVAC Domain Expansion
- Add PLUMBING_HVAC business type
- Add SERVICE and BUNDLE product types
- Create serial_number tracking table
- Create warranty tracking table
- Create product_bundle table
- Add dual unit support to product_variants
- Add serial number and service tracking to sale_items_v2
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_plumbing_hvac'
down_revision = '58d694ffff18'  # After user_settings migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add missing BusinessType enum values
    op.execute("""
        ALTER TYPE businesstype ADD VALUE IF NOT EXISTS 'jewelry';
        ALTER TYPE businesstype ADD VALUE IF NOT EXISTS 'cafe';
        ALTER TYPE businesstype ADD VALUE IF NOT EXISTS 'kitchen';
        ALTER TYPE businesstype ADD VALUE IF NOT EXISTS 'plumbing_hvac';
    """)
    
    # 2. Add SERVICE and BUNDLE to ProductType enum
    op.execute("""
        ALTER TYPE producttype ADD VALUE IF NOT EXISTS 'service';
        ALTER TYPE producttype ADD VALUE IF NOT EXISTS 'bundle';
    """)
    
    # 3. Create serial_numbers table
    op.create_table(
        'serial_numbers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('variant_id', sa.Integer(), nullable=False),
        sa.Column('serial_number', sa.String(), nullable=False),
        sa.Column('sale_id', sa.Integer(), nullable=True),
        sa.Column('sale_item_id', sa.Integer(), nullable=True),
        sa.Column('customer_id', sa.Integer(), nullable=True),
        sa.Column('warranty_start_date', sa.Date(), nullable=True),
        sa.Column('warranty_duration_months', sa.Integer(), nullable=True, server_default='12'),
        sa.Column('warranty_end_date', sa.Date(), nullable=True),
        sa.Column('installation_date', sa.Date(), nullable=True),
        sa.Column('installation_address', sa.Text(), nullable=True),
        sa.Column('installer_name', sa.String(), nullable=True),
        sa.Column('installer_phone', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('is_sold', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_installed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('manufacturer_serial', sa.String(), nullable=True),
        sa.Column('batch_number', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
        sa.ForeignKeyConstraint(['sale_id'], ['sales_v2.id'], ),
        sa.ForeignKeyConstraint(['sale_item_id'], ['sale_items_v2.id'], ),
        sa.ForeignKeyConstraint(['customer_id'], ['customers_v2.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_serial_tenant_number', 'serial_numbers', ['tenant_id', 'serial_number'], unique=True)
    op.create_index('idx_serial_variant', 'serial_numbers', ['variant_id'], unique=False)
    op.create_index('idx_serial_customer', 'serial_numbers', ['customer_id'], unique=False)
    op.create_index('idx_serial_warranty', 'serial_numbers', ['warranty_end_date'], unique=False)
    op.create_index(op.f('ix_serial_numbers_id'), 'serial_numbers', ['id'], unique=False)
    op.create_index(op.f('ix_serial_numbers_is_active'), 'serial_numbers', ['is_active'], unique=False)
    op.create_index(op.f('ix_serial_numbers_is_installed'), 'serial_numbers', ['is_installed'], unique=False)
    op.create_index(op.f('ix_serial_numbers_is_sold'), 'serial_numbers', ['is_sold'], unique=False)
    op.create_index(op.f('ix_serial_numbers_sale_id'), 'serial_numbers', ['sale_id'], unique=False)
    op.create_index(op.f('ix_serial_numbers_sale_item_id'), 'serial_numbers', ['sale_item_id'], unique=False)
    op.create_index(op.f('ix_serial_numbers_serial_number'), 'serial_numbers', ['serial_number'], unique=False)
    op.create_index(op.f('ix_serial_numbers_tenant_id'), 'serial_numbers', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_serial_numbers_variant_id'), 'serial_numbers', ['variant_id'], unique=False)
    
    # 4. Create warranties table
    op.execute("""
        CREATE TYPE warrantystatus AS ENUM ('active', 'expired', 'void', 'claimed');
        CREATE TYPE warranttype AS ENUM ('manufacturer', 'seller', 'installation', 'extended');
    """)
    
    op.create_table(
        'warranties',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('serial_number_id', sa.Integer(), nullable=False),
        sa.Column('warranty_type', postgresql.ENUM('manufacturer', 'seller', 'installation', 'extended', name='warranttype', create_type=False), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('duration_months', sa.Integer(), nullable=False, server_default='12'),
        sa.Column('status', postgresql.ENUM('active', 'expired', 'void', 'claimed', name='warrantystatus', create_type=False), server_default='active', nullable=False),
        sa.Column('coverage_description', sa.Text(), nullable=True),
        sa.Column('terms_and_conditions', sa.Text(), nullable=True),
        sa.Column('warranty_provider', sa.String(), nullable=True),
        sa.Column('claim_count', sa.Integer(), server_default='0', nullable=False),
        sa.Column('last_claim_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('warranty_number', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['serial_number_id'], ['serial_numbers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_warranty_tenant_serial', 'warranties', ['tenant_id', 'serial_number_id'], unique=False)
    op.create_index('idx_warranty_status_date', 'warranties', ['status', 'end_date'], unique=False)
    op.create_index('idx_warranty_number', 'warranties', ['warranty_number'], unique=True)
    op.create_index(op.f('ix_warranties_id'), 'warranties', ['id'], unique=False)
    op.create_index(op.f('ix_warranties_serial_number_id'), 'warranties', ['serial_number_id'], unique=False)
    op.create_index(op.f('ix_warranties_status'), 'warranties', ['status'], unique=False)
    op.create_index(op.f('ix_warranties_tenant_id'), 'warranties', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_warranties_warranty_number'), 'warranties', ['warranty_number'], unique=False)
    
    # 5. Create product_bundles table
    op.create_table(
        'product_bundles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('component_variant_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('price_override', sa.Float(), nullable=True),
        sa.Column('sequence', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products_v2.id'], ),
        sa.ForeignKeyConstraint(['component_variant_id'], ['product_variants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_bundle_product', 'product_bundles', ['product_id', 'sequence'], unique=False)
    op.create_index('idx_bundle_tenant', 'product_bundles', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_product_bundles_component_variant_id'), 'product_bundles', ['component_variant_id'], unique=False)
    op.create_index(op.f('ix_product_bundles_id'), 'product_bundles', ['id'], unique=False)
    op.create_index(op.f('ix_product_bundles_is_active'), 'product_bundles', ['is_active'], unique=False)
    op.create_index(op.f('ix_product_bundles_product_id'), 'product_bundles', ['product_id'], unique=False)
    op.create_index(op.f('ix_product_bundles_tenant_id'), 'product_bundles', ['tenant_id'], unique=False)
    
    # 6. Add dual unit support to product_variants
    op.add_column('product_variants', sa.Column('primary_unit', sa.String(), server_default='piece', nullable=False))
    op.add_column('product_variants', sa.Column('secondary_unit', sa.String(), nullable=True))
    op.add_column('product_variants', sa.Column('unit_conversion_factor', sa.Float(), nullable=True))
    
    # 7. Add serialized inventory support to product_variants
    op.add_column('product_variants', sa.Column('requires_serial_number', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('product_variants', sa.Column('is_serialized', sa.Boolean(), server_default='false', nullable=False))
    op.create_index('ix_product_variants_is_serialized', 'product_variants', ['is_serialized'], unique=False)
    op.create_index('ix_product_variants_requires_serial_number', 'product_variants', ['requires_serial_number'], unique=False)
    
    # 8. Add service item configuration to products_v2
    op.add_column('products_v2', sa.Column('service_duration_hours', sa.Float(), nullable=True))
    op.add_column('products_v2', sa.Column('service_category', sa.String(), nullable=True))
    op.add_column('products_v2', sa.Column('linked_product_ids', postgresql.ARRAY(sa.Integer()), nullable=True))
    
    # 9. Add serial number and service tracking to sale_items_v2
    op.add_column('sale_items_v2', sa.Column('serial_number_id', sa.Integer(), nullable=True))
    op.add_column('sale_items_v2', sa.Column('is_service_item', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('sale_items_v2', sa.Column('linked_sale_item_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_sale_items_serial_number', 'sale_items_v2', 'serial_numbers', ['serial_number_id'], ['id'])
    op.create_foreign_key('fk_sale_items_linked_item', 'sale_items_v2', 'sale_items_v2', ['linked_sale_item_id'], ['id'])
    op.create_index('ix_sale_items_v2_is_service_item', 'sale_items_v2', ['is_service_item'], unique=False)
    op.create_index('ix_sale_items_v2_serial_number_id', 'sale_items_v2', ['serial_number_id'], unique=False)


def downgrade() -> None:
    # Reverse all changes
    op.drop_index('ix_sale_items_v2_serial_number_id', table_name='sale_items_v2')
    op.drop_index('ix_sale_items_v2_is_service_item', table_name='sale_items_v2')
    op.drop_constraint('fk_sale_items_linked_item', 'sale_items_v2', type_='foreignkey')
    op.drop_constraint('fk_sale_items_serial_number', 'sale_items_v2', type_='foreignkey')
    op.drop_column('sale_items_v2', 'linked_sale_item_id')
    op.drop_column('sale_items_v2', 'is_service_item')
    op.drop_column('sale_items_v2', 'serial_number_id')
    
    op.drop_column('products_v2', 'linked_product_ids')
    op.drop_column('products_v2', 'service_category')
    op.drop_column('products_v2', 'service_duration_hours')
    
    op.drop_index('ix_product_variants_requires_serial_number', table_name='product_variants')
    op.drop_index('ix_product_variants_is_serialized', table_name='product_variants')
    op.drop_column('product_variants', 'is_serialized')
    op.drop_column('product_variants', 'requires_serial_number')
    op.drop_column('product_variants', 'unit_conversion_factor')
    op.drop_column('product_variants', 'secondary_unit')
    op.drop_column('product_variants', 'primary_unit')
    
    op.drop_table('product_bundles')
    op.drop_table('warranties')
    op.drop_table('serial_numbers')
    
    op.execute("DROP TYPE IF EXISTS warrantystatus;")
    op.execute("DROP TYPE IF EXISTS warranttype;")
    
    # Note: Cannot remove enum values, so we leave them




