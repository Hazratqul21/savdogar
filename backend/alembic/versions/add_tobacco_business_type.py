"""add_tobacco_business_type

Revision ID: add_tobacco_business_type
Revises: 
Create Date: 2025-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_tobacco_business_type'
down_revision = None  # Update this to your latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Add 'tobacco' to BusinessType enum
    op.execute("""
        ALTER TYPE businesstype ADD VALUE IF NOT EXISTS 'tobacco';
    """)
    
    # Add metadata columns to sales_v2 and sale_items_v2 if they don't exist
    # Check if column exists first
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    
    # Add sale_metadata to sales_v2
    if 'sales_v2' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('sales_v2')]
        if 'metadata' not in columns:
            op.add_column('sales_v2', sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    
    # Add item_metadata to sale_items_v2
    if 'sale_items_v2' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('sale_items_v2')]
        if 'metadata' not in columns:
            op.add_column('sale_items_v2', sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade():
    # Remove metadata columns
    op.drop_column('sale_items_v2', 'metadata')
    op.drop_column('sales_v2', 'metadata')
    
    # Note: Cannot remove enum value in PostgreSQL, so we leave it
