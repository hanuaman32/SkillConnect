"""Add persistent accounts, opportunities, activity, chat, and submissions.

Revision ID: f27c60c1a492
Revises: ab73d54ebc33
Create Date: 2026-11-04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f27c60c1a492"
down_revision: Union[str, None] = "ab73d54ebc33"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "platform_accounts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_platform_accounts")),
    )
    op.create_index(op.f("ix_platform_accounts_email"), "platform_accounts", ["email"], unique=True)
    op.create_table(
        "opportunities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("owner_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("company", sa.String(length=160), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("eligibility", sa.Text(), nullable=False),
        sa.Column("location", sa.String(length=160), nullable=False),
        sa.Column("mode", sa.String(length=30), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("duration", sa.String(length=80), nullable=True),
        sa.Column("trainer", sa.String(length=120), nullable=True),
        sa.Column("salary", sa.String(length=100), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("skills", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["owner_id"], ["platform_accounts.id"], name=op.f("fk_opportunities_owner_id_platform_accounts")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_opportunities")),
    )
    op.create_table(
        "participation_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column("opportunity_id", sa.Integer(), nullable=False),
        sa.Column("kind", sa.String(length=24), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("progress", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["account_id"], ["platform_accounts.id"], name=op.f("fk_participation_records_account_id_platform_accounts")
        ),
        sa.ForeignKeyConstraint(
            ["opportunity_id"], ["opportunities.id"], name=op.f("fk_participation_records_opportunity_id_opportunities")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_participation_records")),
        sa.UniqueConstraint(
            "account_id", "opportunity_id", "kind", name=op.f("uq_participation_records_account_id")
        ),
    )
    op.create_table(
        "platform_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("sender_id", sa.Integer(), nullable=False),
        sa.Column("recipient_id", sa.Integer(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["sender_id"], ["platform_accounts.id"], name=op.f("fk_platform_messages_sender_id_platform_accounts")
        ),
        sa.ForeignKeyConstraint(
            ["recipient_id"], ["platform_accounts.id"], name=op.f("fk_platform_messages_recipient_id_platform_accounts")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_platform_messages")),
    )
    op.create_table(
        "work_submissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("account_id", sa.Integer(), nullable=False),
        sa.Column("opportunity_id", sa.Integer(), nullable=False),
        sa.Column("link", sa.String(length=1000), nullable=True),
        sa.Column("attachment", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["account_id"], ["platform_accounts.id"], name=op.f("fk_work_submissions_account_id_platform_accounts")
        ),
        sa.ForeignKeyConstraint(
            ["opportunity_id"], ["opportunities.id"], name=op.f("fk_work_submissions_opportunity_id_opportunities")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_work_submissions")),
        sa.UniqueConstraint(
            "account_id", "opportunity_id", name=op.f("uq_work_submissions_account_id")
        ),
    )


def downgrade() -> None:
    op.drop_table("work_submissions")
    op.drop_table("platform_messages")
    op.drop_table("participation_records")
    op.drop_table("opportunities")
    op.drop_index(op.f("ix_platform_accounts_email"), table_name="platform_accounts")
    op.drop_table("platform_accounts")
