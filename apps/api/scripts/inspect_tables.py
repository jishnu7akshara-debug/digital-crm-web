import os
from sqlalchemy import create_engine, inspect, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)
inspector = inspect(engine)
tables = inspector.get_table_names()
host = settings.DATABASE_URL.split("@")[-1].split("/")[0]
db_name = settings.DATABASE_URL.split("/")[-1].split("?")[0]
print(f"Connected to DB: {db_name} at {host}")
print(f"Total tables: {len(tables)}\n")

with engine.connect() as conn:
    for t in sorted(tables):
        try:
            cnt = conn.execute(text(f'SELECT count(*) FROM "{t}"')).scalar()
            if cnt > 0:
                print(f"{t:32}: {cnt} rows")
        except Exception as e:
            print(f"{t:32}: error ({e})")
