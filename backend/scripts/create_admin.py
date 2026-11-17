from getpass import getpass

from sqlalchemy import select

from app.core.security import hash_password
from app.database.session import SessionLocal
from app.models.platform import Account


def main() -> None:
    email = input("Admin email: ").strip().lower()
    name = input("Admin name: ").strip()
    password = getpass("Password (8+ characters): ")
    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters.")
    with SessionLocal() as db:
        if db.scalar(select(Account.id).where(Account.email == email)) is not None:
            raise SystemExit("An account already uses that email.")
        admin = Account(name=name, email=email, password_hash=hash_password(password), role="admin")
        db.add(admin)
        db.commit()
    print(f"Admin account created for {email}.")


if __name__ == "__main__":
    main()
