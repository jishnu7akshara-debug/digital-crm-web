import time
import uuid
from datetime import UTC, datetime, timedelta
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    print("Testing CTE multi-table modification in single statement...")
    t0 = time.perf_counter()
    now = datetime.now(UTC)
    la_id = str(uuid.uuid4())
    us_id = str(uuid.uuid4())
    al_id = str(uuid.uuid4())
    
    admin_id = conn.execute(text("SELECT id FROM users WHERE email = 'admin@digitalfootprint.in'")).scalar()
    t_lookup = (time.perf_counter() - t0) * 1000
    print(f"Admin lookup: {t_lookup:.1f}ms (id={admin_id})")

    t0 = time.perf_counter()
    cte_sql = text("""
        WITH ins_la AS (
            INSERT INTO login_attempts (id, email_hash, ip_address, is_success, created_at, updated_at)
            VALUES (:la_id, 'test_hash', '127.0.0.1', true, :now, :now)
        ),
        ins_us AS (
            INSERT INTO user_sessions (id, user_id, token_hash, ip_address, user_agent, expires_at, created_at, updated_at, is_revoked)
            VALUES (:us_id, :user_id, 'bench_token_hash', '127.0.0.1', 'bench', :expires, :now, :now, false)
        ),
        upd_u AS (
            UPDATE users SET last_login_at = :now WHERE id = :user_id
        )
        INSERT INTO audit_logs (id, user_id, user_email, action, resource_type, resource_id, ip_address, timestamp)
        VALUES (:al_id, :user_id, 'admin@digitalfootprint.in', 'user.login', 'user', :user_id, '127.0.0.1', :now)
    """)
    conn.execute(cte_sql, {
        "la_id": la_id,
        "us_id": us_id,
        "al_id": al_id,
        "user_id": admin_id,
        "now": now,
        "expires": now + timedelta(days=7),
    })
    conn.commit()
    t_batch = (time.perf_counter() - t0) * 1000
    print(f"CTE single-statement insert into 4 tables + commit: {t_batch:.1f}ms!")
