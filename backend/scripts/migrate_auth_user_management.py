"""Migrate JurisGuard auth tables to the admin/user approval model.

Run from backend root:
    python scripts/migrate_auth_user_management.py

The project currently uses SQLAlchemy create_all instead of Alembic. This script
keeps the migration explicit for existing SQLite installs and is idempotent for
fresh databases.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import inspect, text

from app.database import Base, engine


def column_names(table: str) -> set[str]:
    inspector = inspect(engine)
    if not inspector.has_table(table):
        return set()
    return {column["name"] for column in inspector.get_columns(table)}


def add_column_if_missing(table: str, column: str, ddl: str) -> None:
    if column in column_names(table):
        return
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {ddl}"))


def migrate_sqlite_users() -> None:
    inspector = inspect(engine)
    if not inspector.has_table("users"):
        Base.metadata.create_all(bind=engine)
        return

    users_columns = column_names("users")
    if "user_id" in users_columns and "password_hash" in users_columns:
        Base.metadata.create_all(bind=engine)
        return

    with engine.begin() as conn:
        conn.execute(text("PRAGMA foreign_keys=OFF"))
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS users_new (
                    user_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(5) NOT NULL,
                    approval_status VARCHAR(12) NOT NULL,
                    is_active BOOLEAN NOT NULL,
                    last_login_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    deleted_at DATETIME
                )
                """
            )
        )
        conn.execute(
            text(
                """
                INSERT INTO users_new (
                    user_id,
                    email,
                    password_hash,
                    role,
                    approval_status,
                    is_active,
                    created_at
                )
                SELECT
                    id,
                    email,
                    hashed_password,
                    CASE WHEN role = 'admin' THEN 'admin' ELSE 'user' END,
                    CASE WHEN is_active = 1 THEN 'approved' ELSE 'suspended' END,
                    is_active,
                    created_at
                FROM users
                WHERE NOT EXISTS (SELECT 1 FROM users_new)
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS user_details (
                    details_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL UNIQUE,
                    first_name VARCHAR(128),
                    middle_name VARCHAR(128),
                    last_name VARCHAR(128),
                    suffix VARCHAR(32),
                    mobile_number VARCHAR(64),
                    address TEXT,
                    sex VARCHAR(32),
                    birth_date DATE,
                    profile_picture_path VARCHAR(1024),
                    profile_completed BOOLEAN NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users_new (user_id)
                )
                """
            )
        )
        if "full_name" in users_columns:
            conn.execute(
                text(
                    """
                    INSERT INTO user_details (user_id, first_name, profile_completed)
                    SELECT id, full_name, 1
                    FROM users
                    WHERE NOT EXISTS (
                        SELECT 1 FROM user_details WHERE user_details.user_id = users.id
                    )
                    """
                )
            )
        conn.execute(text("DROP TABLE users"))
        conn.execute(text("ALTER TABLE users_new RENAME TO users"))
        conn.execute(text("PRAGMA foreign_keys=ON"))

    Base.metadata.create_all(bind=engine)


def migrate_audit_logs() -> None:
    inspector = inspect(engine)
    if not inspector.has_table("audit_logs"):
        Base.metadata.create_all(bind=engine)
        return

    columns = column_names("audit_logs")
    if "audit_id" in columns and "metadata_json" in columns:
        return

    with engine.begin() as conn:
        conn.execute(text("PRAGMA foreign_keys=OFF"))
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS audit_logs_new (
                    audit_id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    action VARCHAR(64) NOT NULL,
                    module VARCHAR(64) NOT NULL,
                    entity_type VARCHAR(64) NOT NULL,
                    entity_id VARCHAR(64),
                    metadata_json TEXT,
                    ip_address VARCHAR(64),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users (user_id)
                )
                """
            )
        )
        conn.execute(
            text(
                """
                INSERT INTO audit_logs_new (
                    audit_id,
                    user_id,
                    action,
                    module,
                    entity_type,
                    entity_id,
                    metadata_json,
                    ip_address,
                    created_at
                )
                SELECT
                    id,
                    user_id,
                    action,
                    'system',
                    entity_type,
                    entity_id,
                    NULL,
                    ip_address,
                    created_at
                FROM audit_logs
                WHERE NOT EXISTS (SELECT 1 FROM audit_logs_new)
                """
            )
        )
        conn.execute(text("DROP TABLE audit_logs"))
        conn.execute(text("ALTER TABLE audit_logs_new RENAME TO audit_logs"))
        conn.execute(text("PRAGMA foreign_keys=ON"))


def migrate_ownership_columns() -> None:
    Base.metadata.create_all(bind=engine)
    if column_names("clients"):
        add_column_if_missing("clients", "created_by_user_id", "created_by_user_id INTEGER")
    if column_names("legal_cases"):
        add_column_if_missing("legal_cases", "created_by_user_id", "created_by_user_id INTEGER")
    if column_names("case_documents"):
        add_column_if_missing("case_documents", "created_by_user_id", "created_by_user_id INTEGER")


def main() -> None:
    if not str(engine.url).startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
        print("Non-SQLite database detected. Created missing tables; use Alembic for managed DDL.")
        return

    migrate_sqlite_users()
    migrate_audit_logs()
    migrate_ownership_columns()
    print("Auth/user management migration complete.")


if __name__ == "__main__":
    main()
