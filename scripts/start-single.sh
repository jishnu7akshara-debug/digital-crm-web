#!/bin/bash
set -e

echo "=========================================="
echo "Starting Digital Footprint OS (Single Deployment)"
echo "=========================================="

# 1. Run database migrations
echo "[1/3] Running database migrations..."
cd /app/apps/api
python -m alembic upgrade head || echo "Migrations finished or skipped."

# 2. Verify core database seed (Super Admin, Roles, Catalogue)
echo "[2/3] Verifying core system seed..."
python seed.py --core-only || echo "Core seed finished."

# 3. Start FastAPI backend on internal port 8000
echo "[3/3] Starting backend daemon on 127.0.0.1:8000..."
uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait for backend health
for i in {1..30}; do
  if curl -s http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
    echo "Backend is ready and healthy."
    break
  fi
  sleep 1
done

# Start Next.js frontend on public PORT (default 3000)
echo "Starting Next.js frontend on 0.0.0.0:${PORT:-3000}..."
cd /app/apps/web
exec pnpm start -p ${PORT:-3000}
