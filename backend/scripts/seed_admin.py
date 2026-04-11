"""Create first admin user: python scripts/seed_admin.py admin@local.test SecretPass123"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Base, SessionLocal, engine
from app.models import User, UserRole
from app.auth import hash_password


def main():
    if len(sys.argv) < 3:
        print("Usage: python scripts/seed_admin.py <email> <password>")
        sys.exit(1)
    email, password = sys.argv[1], sys.argv[2]
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == email).first():
            print("User already exists")
            return
        u = User(
            email=email,
            full_name="System Administrator",
            hashed_password=hash_password(password),
            role=UserRole.admin,
        )
        db.add(u)
        db.commit()
        print("Admin created:", email)
    finally:
        db.close()


if __name__ == "__main__":
    main()
