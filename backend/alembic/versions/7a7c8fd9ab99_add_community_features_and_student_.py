"""Add community features and student profile fields

Revision ID: 7a7c8fd9ab99
Revises: 8eeab94093b2
Create Date: 2025-11-17 00:18:07.016384

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '7a7c8fd9ab99'
down_revision = '8eeab94093b2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to students table
    # Note: Community tables already exist, so we only add student profile fields
    # Check if columns exist first to avoid errors
    conn = op.get_bind()
    
    # Check and add anonymized_name
    result = conn.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='students' AND column_name='anonymized_name'
    """))
    if result.fetchone() is None:
        op.add_column('students', sa.Column('anonymized_name', sa.String(), nullable=True))
    
    # Check and add major
    result = conn.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='students' AND column_name='major'
    """))
    if result.fetchone() is None:
        op.add_column('students', sa.Column('major', sa.String(), nullable=True))
    
    # Check and add bio
    result = conn.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='students' AND column_name='bio'
    """))
    if result.fetchone() is None:
        op.add_column('students', sa.Column('bio', sa.String(), nullable=True))
    
    # Set default anonymized_name for existing students if needed
    op.execute(sa.text("""
        UPDATE students 
        SET anonymized_name = 'U' || LEFT(student_id, 5)
        WHERE anonymized_name IS NULL
    """))


def downgrade() -> None:
    # Remove columns from students table
    op.drop_column('students', 'bio')
    op.drop_column('students', 'major')
    op.drop_column('students', 'anonymized_name')
    # Note: Community tables are kept as they may contain data




