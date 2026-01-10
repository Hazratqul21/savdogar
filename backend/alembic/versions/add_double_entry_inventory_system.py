"""Add Double-Entry Inventory System

Revision ID: add_double_entry_inv
Revises: 58d694ffff18, add_plumbing_hvac
Create Date: 2025-01-04

✅ Enterprise-Grade Integration
- Add double-entry inventory system (StockLocation, StockMove, StockQuant, StockLot)
- Enhance SerialNumber with status tracking and movement history
- Enhance Warranty with additional fields
- Add SerialNumberMovement table for audit trail
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_double_entry_inv'
down_revision = 'add_plumbing_hvac'  # Base on plumbing_hvac (most recent feature branch)
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create enums for stock engine
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE movestate AS ENUM ('draft', 'confirmed', 'assigned', 'done', 'cancelled');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE quantstatus AS ENUM ('available', 'reserved', 'in_transit');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # 2. Create serial number status enums (if not exists)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE serialnumberstatus AS ENUM ('active', 'inactive', 'consumed', 'delivered', 'expired');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE maintenancestatus AS ENUM ('under_warranty', 'out_of_warranty', 'under_amc', 'out_of_amc');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    # 3. Create stock_locations table
    op.create_table(
        'stock_locations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('usage', sa.String(length=50), nullable=False, server_default='internal'),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('is_active', sa.String(length=10), server_default='1', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['parent_id'], ['stock_locations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_location_tenant_code', 'stock_locations', ['tenant_id', 'code'], unique=True)
    op.create_index('idx_location_usage', 'stock_locations', ['usage'], unique=False)
    op.create_index(op.f('ix_stock_locations_id'), 'stock_locations', ['id'], unique=False)
    
    # 4. Create stock_lots table
    op.create_table(
        'stock_lots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=True),
        sa.Column('variant_id', sa.Integer(), nullable=True),
        sa.Column('expiry_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products_v2.id'], ),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_lot_tenant_name', 'stock_lots', ['tenant_id', 'name'], unique=False)
    op.create_index(op.f('ix_stock_lots_id'), 'stock_lots', ['id'], unique=False)
    op.create_index(op.f('ix_stock_lots_name'), 'stock_lots', ['name'], unique=False)
    op.create_index(op.f('ix_stock_lots_product_id'), 'stock_lots', ['product_id'], unique=False)
    op.create_index(op.f('ix_stock_lots_variant_id'), 'stock_lots', ['variant_id'], unique=False)
    
    # 5. Create stock_moves table
    op.create_table(
        'stock_moves',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('reference', sa.String(length=255), nullable=True),
        sa.Column('product_id', sa.Integer(), nullable=True),
        sa.Column('variant_id', sa.Integer(), nullable=True),
        sa.Column('location_id', sa.Integer(), nullable=False),
        sa.Column('location_dest_id', sa.Integer(), nullable=False),
        sa.Column('product_uom_qty', sa.Numeric(precision=18, scale=6), nullable=False),
        sa.Column('quantity_done', sa.Numeric(precision=18, scale=6), server_default='0', nullable=True),
        sa.Column('state', postgresql.ENUM('draft', 'confirmed', 'assigned', 'done', 'cancelled', name='movestate', create_type=False), server_default='draft', nullable=False),
        sa.Column('lot_id', sa.Integer(), nullable=True),
        sa.Column('package_id', sa.Integer(), nullable=True),
        sa.Column('owner_id', sa.Integer(), nullable=True),
        sa.Column('date', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('date_done', sa.DateTime(), nullable=True),
        sa.Column('origin', sa.String(length=255), nullable=True),
        sa.Column('inventory_movement_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
        sa.ForeignKeyConstraint(['location_id'], ['stock_locations.id'], ),
        sa.ForeignKeyConstraint(['location_dest_id'], ['stock_locations.id'], ),
        sa.ForeignKeyConstraint(['lot_id'], ['stock_lots.id'], ),
        sa.ForeignKeyConstraint(['inventory_movement_id'], ['inventory_movements.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('product_uom_qty >= 0', name='check_positive_uom_qty'),
        sa.CheckConstraint('quantity_done >= 0', name='check_positive_done_qty'),
        sa.CheckConstraint('(product_id IS NOT NULL) OR (variant_id IS NOT NULL)', name='check_move_has_product')
    )
    op.create_index('idx_move_product_location', 'stock_moves', ['variant_id', 'location_id', 'location_dest_id', 'state'], unique=False)
    op.create_index('idx_move_state_date', 'stock_moves', ['state', 'date'], unique=False)
    op.create_index('idx_move_tenant', 'stock_moves', ['tenant_id', 'state'], unique=False)
    op.create_index(op.f('ix_stock_moves_id'), 'stock_moves', ['id'], unique=False)
    op.create_index(op.f('ix_stock_moves_location_dest_id'), 'stock_moves', ['location_dest_id'], unique=False)
    op.create_index(op.f('ix_stock_moves_location_id'), 'stock_moves', ['location_id'], unique=False)
    op.create_index(op.f('ix_stock_moves_lot_id'), 'stock_moves', ['lot_id'], unique=False)
    op.create_index(op.f('ix_stock_moves_product_id'), 'stock_moves', ['product_id'], unique=False)
    op.create_index(op.f('ix_stock_moves_reference'), 'stock_moves', ['reference'], unique=False)
    op.create_index(op.f('ix_stock_moves_variant_id'), 'stock_moves', ['variant_id'], unique=False)
    
    # 6. Create stock_quants table
    op.create_table(
        'stock_quants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=True),
        sa.Column('variant_id', sa.Integer(), nullable=True),
        sa.Column('location_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=18, scale=6), server_default='0', nullable=False),
        sa.Column('reserved_quantity', sa.Numeric(precision=18, scale=6), server_default='0', nullable=False),
        sa.Column('lot_id', sa.Integer(), nullable=True),
        sa.Column('package_id', sa.Integer(), nullable=True),
        sa.Column('owner_id', sa.Integer(), nullable=True),
        sa.Column('status', postgresql.ENUM('available', 'reserved', 'in_transit', name='quantstatus', create_type=False), server_default='available', nullable=False),
        sa.Column('in_date', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('move_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
        sa.ForeignKeyConstraint(['location_id'], ['stock_locations.id'], ),
        sa.ForeignKeyConstraint(['lot_id'], ['stock_lots.id'], ),
        sa.ForeignKeyConstraint(['move_id'], ['stock_moves.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('(product_id IS NOT NULL) OR (variant_id IS NOT NULL)', name='check_quant_has_product')
    )
    op.create_index('idx_quant_product_location', 'stock_quants', ['variant_id', 'location_id', 'lot_id', 'package_id', 'owner_id'], unique=False)
    op.create_index('idx_quant_location_status', 'stock_quants', ['location_id', 'status'], unique=False)
    op.create_index('idx_quant_tenant', 'stock_quants', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_stock_quants_id'), 'stock_quants', ['id'], unique=False)
    op.create_index(op.f('ix_stock_quants_location_id'), 'stock_quants', ['location_id'], unique=False)
    op.create_index(op.f('ix_stock_quants_lot_id'), 'stock_quants', ['lot_id'], unique=False)
    op.create_index(op.f('ix_stock_quants_move_id'), 'stock_quants', ['move_id'], unique=False)
    op.create_index(op.f('ix_stock_quants_owner_id'), 'stock_quants', ['owner_id'], unique=False)
    op.create_index(op.f('ix_stock_quants_package_id'), 'stock_quants', ['package_id'], unique=False)
    op.create_index(op.f('ix_stock_quants_product_id'), 'stock_quants', ['product_id'], unique=False)
    op.create_index(op.f('ix_stock_quants_variant_id'), 'stock_quants', ['variant_id'], unique=False)
    
    # 7. Add new columns to serial_numbers table
    op.add_column('serial_numbers', sa.Column('status', postgresql.ENUM('active', 'inactive', 'consumed', 'delivered', 'expired', name='serialnumberstatus', create_type=False), server_default='active', nullable=False))
    op.add_column('serial_numbers', sa.Column('maintenance_status', postgresql.ENUM('under_warranty', 'out_of_warranty', 'under_amc', 'out_of_amc', name='maintenancestatus', create_type=False), nullable=True))
    op.add_column('serial_numbers', sa.Column('warehouse', sa.String(), nullable=True))
    op.add_column('serial_numbers', sa.Column('location', sa.String(), nullable=True))
    op.add_column('serial_numbers', sa.Column('amc_start_date', sa.Date(), nullable=True))
    op.add_column('serial_numbers', sa.Column('amc_expiry_date', sa.Date(), nullable=True))
    op.add_column('serial_numbers', sa.Column('amc_provider', sa.String(), nullable=True))
    op.add_column('serial_numbers', sa.Column('purchase_rate', sa.Float(), nullable=True))
    op.add_column('serial_numbers', sa.Column('posting_date', sa.Date(), nullable=True))
    op.add_column('serial_numbers', sa.Column('reference_type', sa.String(length=100), nullable=True))
    op.add_column('serial_numbers', sa.Column('reference_name', sa.String(length=255), nullable=True))
    
    op.create_index('idx_serial_status_maintenance', 'serial_numbers', ['status', 'maintenance_status'], unique=False)
    op.create_index('idx_serial_amc_expiry', 'serial_numbers', ['amc_expiry_date'], unique=False)
    op.create_index(op.f('ix_serial_numbers_reference_name'), 'serial_numbers', ['reference_name'], unique=False)
    op.create_index(op.f('ix_serial_numbers_warehouse'), 'serial_numbers', ['warehouse'], unique=False)
    
    # 8. Create serial_number_movements table
    op.create_table(
        'serial_number_movements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('serial_number_id', sa.Integer(), nullable=False),
        sa.Column('move_id', sa.Integer(), nullable=True),
        sa.Column('reference_type', sa.String(length=100), nullable=True),
        sa.Column('reference_name', sa.String(length=255), nullable=True),
        sa.Column('from_location', sa.String(length=255), nullable=True),
        sa.Column('to_location', sa.String(length=255), nullable=True),
        sa.Column('from_warehouse', sa.String(length=255), nullable=True),
        sa.Column('to_warehouse', sa.String(length=255), nullable=True),
        sa.Column('movement_type', sa.String(length=50), nullable=False),
        sa.Column('movement_date', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['serial_number_id'], ['serial_numbers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_serial_movement_date', 'serial_number_movements', ['serial_number_id', 'movement_date'], unique=False)
    op.create_index('idx_serial_movement_tenant', 'serial_number_movements', ['tenant_id', 'movement_date'], unique=False)
    op.create_index(op.f('ix_serial_number_movements_id'), 'serial_number_movements', ['id'], unique=False)
    op.create_index(op.f('ix_serial_number_movements_move_id'), 'serial_number_movements', ['move_id'], unique=False)
    op.create_index(op.f('ix_serial_number_movements_reference_name'), 'serial_number_movements', ['reference_name'], unique=False)
    op.create_index(op.f('ix_serial_number_movements_serial_number_id'), 'serial_number_movements', ['serial_number_id'], unique=False)
    
    # 9. Add new columns to warranties table
    op.add_column('warranties', sa.Column('duration_days', sa.Integer(), nullable=True))
    op.add_column('warranties', sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False))
    op.add_column('warranties', sa.Column('warranty_terms', sa.Text(), nullable=True))
    op.add_column('warranties', sa.Column('provider', sa.String(), nullable=True))
    
    op.create_index('idx_warranty_expiry', 'warranties', ['end_date', 'is_active'], unique=False)
    op.create_index(op.f('ix_warranties_is_active'), 'warranties', ['is_active'], unique=False)


def downgrade() -> None:
    # Reverse order of upgrade
    op.drop_index(op.f('ix_warranties_is_active'), table_name='warranties')
    op.drop_index('idx_warranty_expiry', table_name='warranties')
    op.drop_column('warranties', 'provider')
    op.drop_column('warranties', 'warranty_terms')
    op.drop_column('warranties', 'is_active')
    op.drop_column('warranties', 'duration_days')
    
    op.drop_index(op.f('ix_serial_number_movements_serial_number_id'), table_name='serial_number_movements')
    op.drop_index(op.f('ix_serial_number_movements_reference_name'), table_name='serial_number_movements')
    op.drop_index(op.f('ix_serial_number_movements_move_id'), table_name='serial_number_movements')
    op.drop_index(op.f('ix_serial_number_movements_id'), table_name='serial_number_movements')
    op.drop_index('idx_serial_movement_tenant', table_name='serial_number_movements')
    op.drop_index('idx_serial_movement_date', table_name='serial_number_movements')
    op.drop_table('serial_number_movements')
    
    op.drop_index(op.f('ix_serial_numbers_warehouse'), table_name='serial_numbers')
    op.drop_index(op.f('ix_serial_numbers_reference_name'), table_name='serial_numbers')
    op.drop_index('idx_serial_amc_expiry', table_name='serial_numbers')
    op.drop_index('idx_serial_status_maintenance', table_name='serial_numbers')
    op.drop_column('serial_numbers', 'reference_name')
    op.drop_column('serial_numbers', 'reference_type')
    op.drop_column('serial_numbers', 'posting_date')
    op.drop_column('serial_numbers', 'purchase_rate')
    op.drop_column('serial_numbers', 'amc_provider')
    op.drop_column('serial_numbers', 'amc_expiry_date')
    op.drop_column('serial_numbers', 'amc_start_date')
    op.drop_column('serial_numbers', 'location')
    op.drop_column('serial_numbers', 'warehouse')
    op.drop_column('serial_numbers', 'maintenance_status')
    op.drop_column('serial_numbers', 'status')
    
    op.drop_index(op.f('ix_stock_quants_variant_id'), table_name='stock_quants')
    op.drop_index(op.f('ix_stock_quants_product_id'), table_name='stock_quants')
    op.drop_index(op.f('ix_stock_quants_package_id'), table_name='stock_quants')
    op.drop_index(op.f('ix_stock_quants_owner_id'), table_name='stock_quants')
    op.drop_index(op.f('ix_stock_quants_move_id'), table_name='stock_quants')
    op.drop_index(op.f('ix_stock_quants_location_id'), table_name='stock_quants')
    op.drop_index(op.f('ix_stock_quants_id'), table_name='stock_quants')
    op.drop_index('idx_quant_tenant', table_name='stock_quants')
    op.drop_index('idx_quant_location_status', table_name='stock_quants')
    op.drop_index('idx_quant_product_location', table_name='stock_quants')
    op.drop_table('stock_quants')
    
    op.drop_index(op.f('ix_stock_moves_variant_id'), table_name='stock_moves')
    op.drop_index(op.f('ix_stock_moves_reference'), table_name='stock_moves')
    op.drop_index(op.f('ix_stock_moves_product_id'), table_name='stock_moves')
    op.drop_index(op.f('ix_stock_moves_lot_id'), table_name='stock_moves')
    op.drop_index(op.f('ix_stock_moves_location_id'), table_name='stock_moves')
    op.drop_index(op.f('ix_stock_moves_location_dest_id'), table_name='stock_moves')
    op.drop_index(op.f('ix_stock_moves_id'), table_name='stock_moves')
    op.drop_index('idx_move_tenant', table_name='stock_moves')
    op.drop_index('idx_move_state_date', table_name='stock_moves')
    op.drop_index('idx_move_product_location', table_name='stock_moves')
    op.drop_table('stock_moves')
    
    op.drop_index(op.f('ix_stock_lots_variant_id'), table_name='stock_lots')
    op.drop_index(op.f('ix_stock_lots_product_id'), table_name='stock_lots')
    op.drop_index(op.f('ix_stock_lots_name'), table_name='stock_lots')
    op.drop_index(op.f('ix_stock_lots_id'), table_name='stock_lots')
    op.drop_index('idx_lot_tenant_name', table_name='stock_lots')
    op.drop_table('stock_lots')
    
    op.drop_index(op.f('ix_stock_locations_id'), table_name='stock_locations')
    op.drop_index('idx_location_usage', table_name='stock_locations')
    op.drop_index('idx_location_tenant_code', table_name='stock_locations')
    op.drop_table('stock_locations')
    
    # Drop enums (careful - only if not used elsewhere)
    # op.execute("DROP TYPE IF EXISTS maintenancestatus")
    # op.execute("DROP TYPE IF EXISTS serialnumberstatus")
    # op.execute("DROP TYPE IF EXISTS quantstatus")
    # op.execute("DROP TYPE IF EXISTS movestate")

