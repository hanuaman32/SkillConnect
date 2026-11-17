"""Add persistent saves and training curriculum progress.

Revision ID: 1d3b8c2e7f10
Revises: f27c60c1a492
Create Date: 2026-11-04 12:27:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "1d3b8c2e7f10"
down_revision: Union[str, None] = "f27c60c1a492"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "saved_opportunities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column("opportunity_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["account_id"], ["platform_accounts.id"], name=op.f("fk_saved_opportunities_account_id_platform_accounts"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["opportunity_id"], ["opportunities.id"], name=op.f("fk_saved_opportunities_opportunity_id_opportunities"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_saved_opportunities")),
        sa.UniqueConstraint("account_id", "opportunity_id", name=op.f("uq_saved_opportunities_account_id")),
    )
    op.create_table(
        "opportunity_training_modules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("opportunity_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["opportunity_id"], ["opportunities.id"],
            name=op.f("fk_opportunity_training_modules_opportunity_id_opportunities"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_opportunity_training_modules")),
    )
    op.create_index(
        op.f("ix_opportunity_training_modules_opportunity_id"),
        "opportunity_training_modules",
        ["opportunity_id"],
    )
    op.create_table(
        "opportunity_training_lessons",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("module_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["module_id"], ["opportunity_training_modules.id"],
            name=op.f("fk_opportunity_training_lessons_module_id_opportunity_training_modules"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_opportunity_training_lessons")),
    )
    op.create_index(
        op.f("ix_opportunity_training_lessons_module_id"),
        "opportunity_training_lessons",
        ["module_id"],
    )
    op.create_table(
        "lesson_progress_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column("lesson_id", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["account_id"], ["platform_accounts.id"],
            name=op.f("fk_lesson_progress_records_account_id_platform_accounts"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["lesson_id"], ["opportunity_training_lessons.id"],
            name=op.f("fk_lesson_progress_records_lesson_id_opportunity_training_lessons"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_lesson_progress_records")),
        sa.UniqueConstraint("account_id", "lesson_id", name=op.f("uq_lesson_progress_records_account_id")),
    )


def downgrade() -> None:
    op.drop_table("lesson_progress_records")
    op.drop_index(op.f("ix_opportunity_training_lessons_module_id"), table_name="opportunity_training_lessons")
    op.drop_table("opportunity_training_lessons")
    op.drop_index(op.f("ix_opportunity_training_modules_opportunity_id"), table_name="opportunity_training_modules")
    op.drop_table("opportunity_training_modules")
    op.drop_table("saved_opportunities")
