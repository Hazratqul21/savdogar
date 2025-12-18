"""add_business_type_to_tenant

Revision ID: a1b2c3d4e5f6
Revises: 801c8abbf208
Create Date: 2025-12-19 01:10:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '801c8abbf208'
branch_labels = None
depends_on = None

def upgrade():
    # Create enum type
    business_type = postgresql.ENUM('retail', 'fashion', 'horeca', 'wholesale', 'jewelry', name='businesstype', create_type=False)
    business_type.create(op.get_bind(), checkfirst=True)
    
    op.add_column('tenants', sa.Column('business_type', business_type, nullable=False, server_default='retail'))
    op.add_column('tenants', sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.create_index(op.f('ix_tenants_business_type'), 'tenants', ['business_type'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_tenants_business_type'), table_name='tenants')
    op.drop_column('tenants', 'config')
    op.drop_column('tenants', 'business_type')
    # drop type if needed but usually okay to leave
