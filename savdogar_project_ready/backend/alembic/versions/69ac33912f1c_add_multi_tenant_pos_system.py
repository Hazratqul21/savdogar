"""add_multi_tenant_pos_system

Revision ID: 69ac33912f1c
Revises: 9e9d49645017
Create Date: 2025-12-16 02:39:18.929501

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '69ac33912f1c'
down_revision: Union[str, Sequence[str], None] = '9e9d49645017'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Multi-tenant POS system."""
    
    # 1. Tenants jadvali
    op.create_table(
        'tenants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('business_type', sa.Enum('retail', 'fashion', 'horeca', 'wholesale', name='businesstype'), nullable=False),
        sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tenants_name'), 'tenants', ['name'], unique=False)
    op.create_index(op.f('ix_tenants_business_type'), 'tenants', ['business_type'], unique=False)
    op.create_index(op.f('ix_tenants_is_active'), 'tenants', ['is_active'], unique=False)
    
    # 2. Users jadvaliga tenant_id qo'shish
    op.add_column('users', sa.Column('tenant_id', sa.Integer(), nullable=True))
    op.create_index(op.f('ix_users_tenant_id'), 'users', ['tenant_id'], unique=False)
    op.create_foreign_key('fk_users_tenant', 'users', 'tenants', ['tenant_id'], ['id'])
    
    # 3. Products V2 jadvali
    op.create_table(
        'products_v2',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type', sa.Enum('simple', 'variable', 'composite', name='producttype'), nullable=False),
        sa.Column('base_price', sa.Float(), nullable=True),
        sa.Column('cost_price', sa.Float(), nullable=True),
        sa.Column('tax_rate', sa.Float(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_products_v2_name'), 'products_v2', ['name'], unique=False)
    op.create_index(op.f('ix_products_v2_is_active'), 'products_v2', ['is_active'], unique=False)
    op.create_index('idx_products_tenant_active', 'products_v2', ['tenant_id', 'is_active'], unique=False)
    
    # 4. Product Variants jadvali
    op.create_table(
        'product_variants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('sku', sa.String(), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('cost_price', sa.Float(), nullable=True),
        sa.Column('stock_quantity', sa.Float(), nullable=True),
        sa.Column('min_stock_level', sa.Float(), nullable=True),
        sa.Column('max_stock_level', sa.Float(), nullable=True),
        sa.Column('attributes', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('barcode_aliases', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products_v2.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_product_variants_sku'), 'product_variants', ['sku'], unique=False)
    op.create_index(op.f('ix_product_variants_is_active'), 'product_variants', ['is_active'], unique=False)
    op.create_index('idx_variants_tenant_sku', 'product_variants', ['tenant_id', 'sku'], unique=True)
    op.create_index('idx_variants_attributes', 'product_variants', ['attributes'], unique=False, postgresql_using='gin')
    op.create_index('idx_variants_barcodes', 'product_variants', ['barcode_aliases'], unique=False, postgresql_using='gin')
    
    # 5. Price Tiers jadvali
    op.create_table(
        'price_tiers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('variant_id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('tier_type', sa.Enum('retail', 'vip', 'wholesaler', 'bulk', name='pricetiertype'), nullable=False),
        sa.Column('min_quantity', sa.Float(), nullable=False),
        sa.Column('max_quantity', sa.Float(), nullable=True),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('customer_group', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_price_tiers_variant_quantity', 'price_tiers', ['variant_id', 'min_quantity'], unique=False)
    op.create_index('idx_price_tiers_tenant', 'price_tiers', ['tenant_id'], unique=False)
    
    # 6. Customers V2 jadvali
    op.create_table(
        'customers_v2',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('price_tier', sa.Enum('retail', 'vip', 'wholesaler', name='customertier'), nullable=False),
        sa.Column('balance', sa.Float(), nullable=False),
        sa.Column('credit_limit', sa.Float(), nullable=True),
        sa.Column('max_debt_allowed', sa.Float(), nullable=True),
        sa.Column('loyalty_points', sa.Float(), nullable=True),
        sa.Column('ai_preferences', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customers_v2_name'), 'customers_v2', ['name'], unique=False)
    op.create_index(op.f('ix_customers_v2_phone'), 'customers_v2', ['phone'], unique=False)
    op.create_index('idx_customers_tenant_phone', 'customers_v2', ['tenant_id', 'phone'], unique=False)
    op.create_index('idx_customers_tier', 'customers_v2', ['price_tier'], unique=False)
    
    # 7. Customer Transactions V2
    # Check if paymentmethod enum exists (might already exist from sale.py)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE paymentmethod AS ENUM ('cash', 'card', 'transfer', 'debt', 'mixed', 'payme', 'click');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.create_table(
        'customer_transactions_v2',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('sale_id', sa.Integer(), nullable=True),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('transaction_type', sa.String(), nullable=False),
        sa.Column('payment_method', postgresql.ENUM('cash', 'card', 'transfer', 'debt', 'mixed', 'payme', 'click', name='paymentmethod', create_type=False), nullable=True),
        sa.Column('points_earned', sa.Float(), nullable=True),
        sa.Column('points_used', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['customer_id'], ['customers_v2.id'], ),
        sa.ForeignKeyConstraint(['sale_id'], ['sales.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_customer_transactions_v2_customer_id'), 'customer_transactions_v2', ['customer_id'], unique=False)
    op.create_index(op.f('ix_customer_transactions_v2_sale_id'), 'customer_transactions_v2', ['sale_id'], unique=False)
    
    # 8. Customer Ledger jadvali
    op.create_table(
        'customer_ledger',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('sale_id', sa.Integer(), nullable=True),
        sa.Column('debit', sa.Float(), nullable=True),
        sa.Column('credit', sa.Float(), nullable=True),
        sa.Column('balance_after', sa.Float(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('reference_number', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['customer_id'], ['customers_v2.id'], ),
        sa.ForeignKeyConstraint(['sale_id'], ['sales.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_ledger_customer_date', 'customer_ledger', ['customer_id', 'created_at'], unique=False)
    op.create_index(op.f('ix_customer_ledger_customer_id'), 'customer_ledger', ['customer_id'], unique=False)
    op.create_index(op.f('ix_customer_ledger_sale_id'), 'customer_ledger', ['sale_id'], unique=False)
    
    # 9. Sales V2 jadvali
    # Check if salestatus enum exists, create if not
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE salestatus AS ENUM ('pending', 'completed', 'cancelled', 'refunded');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    """)
    
    op.create_table(
        'sales_v2',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('cashier_id', sa.Integer(), nullable=True),
        sa.Column('customer_id', sa.Integer(), nullable=True),
        sa.Column('branch_id', sa.Integer(), nullable=True),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('subtotal', sa.Float(), nullable=True),
        sa.Column('tax_amount', sa.Float(), nullable=True),
        sa.Column('discount_amount', sa.Float(), nullable=True),
        sa.Column('payment_method', postgresql.ENUM('cash', 'card', 'transfer', 'debt', 'mixed', 'payme', 'click', name='paymentmethod', create_type=False), nullable=False),
        sa.Column('status', postgresql.ENUM('pending', 'completed', 'cancelled', 'refunded', name='salestatus', create_type=False), nullable=False),
        sa.Column('is_debt', sa.Boolean(), nullable=True),
        sa.Column('debt_amount', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('receipt_number', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['branch_id'], ['branches.id'], ),
        sa.ForeignKeyConstraint(['cashier_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['customer_id'], ['customers_v2.id'], ),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sales_v2_created_at'), 'sales_v2', ['created_at'], unique=False)
    op.create_index(op.f('ix_sales_v2_is_debt'), 'sales_v2', ['is_debt'], unique=False)
    op.create_index('idx_sales_tenant_date', 'sales_v2', ['tenant_id', 'created_at'], unique=False)
    op.create_index(op.f('ix_sales_v2_customer_id'), 'sales_v2', ['customer_id'], unique=False)
    op.create_index(op.f('ix_sales_v2_cashier_id'), 'sales_v2', ['cashier_id'], unique=False)
    op.create_index(op.f('ix_sales_v2_receipt_number'), 'sales_v2', ['receipt_number'], unique=False)
    op.create_index('idx_sales_debt', 'sales_v2', ['is_debt', 'status'], unique=False)
    
    # 10. Sale Items V2 jadvali
    op.create_table(
        'sale_items_v2',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sale_id', sa.Integer(), nullable=False),
        sa.Column('variant_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('cost_price', sa.Float(), nullable=True),
        sa.Column('total', sa.Float(), nullable=False),
        sa.Column('discount_percent', sa.Float(), nullable=True),
        sa.Column('discount_amount', sa.Float(), nullable=True),
        sa.Column('tax_rate', sa.Float(), nullable=True),
        sa.Column('tax_amount', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['sale_id'], ['sales_v2.id'], ),
        sa.ForeignKeyConstraint(['variant_id'], ['product_variants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sale_items_v2_sale_id'), 'sale_items_v2', ['sale_id'], unique=False)
    op.create_index(op.f('ix_sale_items_v2_variant_id'), 'sale_items_v2', ['variant_id'], unique=False)
    op.create_index('idx_sale_items_variant', 'sale_items_v2', ['variant_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Jadvalarni teskari tartibda o'chirish
    op.drop_index('idx_sale_items_variant', table_name='sale_items_v2')
    op.drop_index(op.f('ix_sale_items_v2_variant_id'), table_name='sale_items_v2')
    op.drop_index(op.f('ix_sale_items_v2_sale_id'), table_name='sale_items_v2')
    op.drop_table('sale_items_v2')
    
    op.drop_index('idx_sales_debt', table_name='sales_v2')
    op.drop_index(op.f('ix_sales_v2_receipt_number'), table_name='sales_v2')
    op.drop_index(op.f('ix_sales_v2_cashier_id'), table_name='sales_v2')
    op.drop_index(op.f('ix_sales_v2_customer_id'), table_name='sales_v2')
    op.drop_index('idx_sales_tenant_date', table_name='sales_v2')
    op.drop_index(op.f('ix_sales_v2_is_debt'), table_name='sales_v2')
    op.drop_index(op.f('ix_sales_v2_created_at'), table_name='sales_v2')
    op.drop_table('sales_v2')
    
    op.drop_index(op.f('ix_customer_ledger_sale_id'), table_name='customer_ledger')
    op.drop_index(op.f('ix_customer_ledger_customer_id'), table_name='customer_ledger')
    op.drop_index('idx_ledger_customer_date', table_name='customer_ledger')
    op.drop_table('customer_ledger')
    
    op.drop_index(op.f('ix_customer_transactions_v2_sale_id'), table_name='customer_transactions_v2')
    op.drop_index(op.f('ix_customer_transactions_v2_customer_id'), table_name='customer_transactions_v2')
    op.drop_table('customer_transactions_v2')
    
    op.drop_index('idx_customers_tier', table_name='customers_v2')
    op.drop_index('idx_customers_tenant_phone', table_name='customers_v2')
    op.drop_index(op.f('ix_customers_v2_phone'), table_name='customers_v2')
    op.drop_index(op.f('ix_customers_v2_name'), table_name='customers_v2')
    op.drop_table('customers_v2')
    
    op.drop_index('idx_price_tiers_tenant', table_name='price_tiers')
    op.drop_index('idx_price_tiers_variant_quantity', table_name='price_tiers')
    op.drop_table('price_tiers')
    
    op.drop_index('idx_variants_barcodes', table_name='product_variants')
    op.drop_index('idx_variants_attributes', table_name='product_variants')
    op.drop_index('idx_variants_tenant_sku', table_name='product_variants')
    op.drop_index(op.f('ix_product_variants_is_active'), table_name='product_variants')
    op.drop_index(op.f('ix_product_variants_sku'), table_name='product_variants')
    op.drop_table('product_variants')
    
    op.drop_index('idx_products_tenant_active', table_name='products_v2')
    op.drop_index(op.f('ix_products_v2_is_active'), table_name='products_v2')
    op.drop_index(op.f('ix_products_v2_name'), table_name='products_v2')
    op.drop_table('products_v2')
    
    op.drop_constraint('fk_users_tenant', 'users', type_='foreignkey')
    op.drop_index(op.f('ix_users_tenant_id'), table_name='users')
    op.drop_column('users', 'tenant_id')
    
    op.drop_index(op.f('ix_tenants_is_active'), table_name='tenants')
    op.drop_index(op.f('ix_tenants_business_type'), table_name='tenants')
    op.drop_index(op.f('ix_tenants_name'), table_name='tenants')
    op.drop_table('tenants')
    
    # Enum tiplarni o'chirish
    op.execute("DROP TYPE IF EXISTS salestatus")
    op.execute("DROP TYPE IF EXISTS paymentmethod")
    op.execute("DROP TYPE IF EXISTS customertier")
    op.execute("DROP TYPE IF EXISTS pricetiertype")
    op.execute("DROP TYPE IF EXISTS producttype")
    op.execute("DROP TYPE IF EXISTS businesstype")
