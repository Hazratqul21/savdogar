"""add_attributes_to_product

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2025-12-19 01:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6g7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('products', sa.Column('attributes', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    # op.create_index(op.f('ix_products_embedding_vector'), 'products', ['embedding_vector'], unique=False) # Ensure this if not exists

def downgrade():
    op.drop_column('products', 'attributes')
