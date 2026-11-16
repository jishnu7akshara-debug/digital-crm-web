import time
import hashlib
from datetime import UTC, datetime, timedelta
from app.core.database import SessionLocal
from app.core.security import verify_password, generate_secure_token, hash_token
from app.db.models.auth import LoginAttempt, User, UserSession, Role, Permission, UserRole
from app.core.audit import log_audit_event
from app.api.v1.auth import get_user_permissions

db = SessionLocal()

print("Profiling Login internals directly against database...")

# Step 0: ping / warmup
t0 = time.perf_counter()
db.execute(text("SELECT 1") if "text" in locals() else UserSession.__table__.select().limit(1))
print(f"Step 0 (Pool check / ping): {(time.perf_counter() - t0)*1000:.1f}ms")

email_clean = "admin@digitalfootprint.in"
password = "Admin@123456!"
email_hash = hashlib.sha256(email_clean.encode("utf-8")).hexdigest()

# Step 1: Failed attempts count
t0 = time.perf_counter()
window_start = datetime.now(UTC) - timedelta(minutes=15)
failed_attempts = (
    db.query(LoginAttempt)
    .filter(
        (LoginAttempt.email_hash == email_hash),
        LoginAttempt.is_success.is_(False),
        LoginAttempt.created_at >= window_start,
    )
    .count()
)
print(f"Step 1 (Failed attempts query): {(time.perf_counter() - t0)*1000:.1f}ms")

# Step 2: User lookup
t0 = time.perf_counter()
user = db.query(User).filter(User.email == email_clean, User.is_deleted.is_(False)).first()
print(f"Step 2 (User lookup): {(time.perf_counter() - t0)*1000:.1f}ms")

# Step 3: verify password
t0 = time.perf_counter()
matched = verify_password(password, user.hashed_password)
print(f"Step 3 (Argon2 verify): {(time.perf_counter() - t0)*1000:.1f}ms (matched={matched})")

# Step 4: Login attempt + session insert
t0 = time.perf_counter()
token = generate_secure_token(32)
token_hash = hash_token(token)
expires_at = datetime.now(UTC) + timedelta(days=7)

db.add(LoginAttempt(email_hash=email_hash, ip_address="127.0.0.1", is_success=True))
session_entry = UserSession(
    user_id=user.id,
    token_hash=token_hash,
    ip_address="127.0.0.1",
    user_agent="bench",
    expires_at=expires_at,
)
db.add(session_entry)
user.last_login_at = datetime.now(UTC)
print(f"Step 4 (Object creations in memory): {(time.perf_counter() - t0)*1000:.1f}ms")

# Step 5: db.commit()
t0 = time.perf_counter()
db.commit()
print(f"Step 5 (db.commit()): {(time.perf_counter() - t0)*1000:.1f}ms")

# Step 6: get_user_permissions
t0 = time.perf_counter()
roles, perms = get_user_permissions(user, db)
print(f"Step 6 (get_user_permissions): {(time.perf_counter() - t0)*1000:.1f}ms")

db.close()
