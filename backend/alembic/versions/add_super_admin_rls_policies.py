"""add_super_admin_rls_policies

Revision ID: add_super_admin_rls
Revises: ec1025c712c7
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'add_super_admin_rls'
down_revision: Union[str, Sequence[str], None] = 'ec1025c712c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Add RLS policies for Super Admin access.
    
    This migration creates SQL functions and policies that allow users with
    role = 'super_admin' to have unrestricted access to all tables, bypassing
    tenant_id isolation.
    
    IMPORTANT: This is a Supabase-specific migration. Run this SQL directly
    in Supabase SQL Editor, not via Alembic.
    """
    # Note: Alembic doesn't directly support Supabase RLS policies.
    # This migration file documents the SQL that needs to be run in Supabase.
    # The actual SQL is in the companion file: supabase_rls_policies.sql
    pass


def downgrade() -> None:
    """
    Remove Super Admin RLS policies.
    Run the DROP statements from supabase_rls_policies.sql in reverse.
    """
    pass
