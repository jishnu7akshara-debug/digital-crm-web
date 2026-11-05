# Digital Footprint OS

> Enterprise Internal CRM + Project Management + HRMS + Finance + Client Portal for Digital Footprint.

Production-grade modular monolith architecture deploying **Next.js frontend** and **Python FastAPI backend** together as **one Vercel project** on the unified origin `crm.digitalfootprint.in`.

---

## 🏛️ System Architecture

```
                                  [ Browser / Client ]
                                           │
                                           │ crm.digitalfootprint.in
                                           ▼
                            ┌───────────────────────────────┐
                            │    Vercel Single Origin       │
                            ├──────────────┬────────────────┤
                            │              │                │
                      Pages │ /            │ /api/v1/*      │
                            ▼              ▼                │
                     [ Next.js 15 ]   [ FastAPI 0.115+ ]    │
                     (App Router)     (Python 3.12 Engine)  │
                            │              │                │
                            └───────┬──────┴────────────────┘
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
               [ PostgreSQL 15+ ]     [ S3 / Cloudflare R2 ]
             (SQLAlchemy 2.x Alembic)    (Private Assets)
```

- **Single Origin**: Frontend served at `/`, API served at `/api/v1/*` (zero CORS, first-party HTTP-only cookies).
- **Frontend Stack**: Next.js App Router, React 19, TypeScript strict, Tailwind CSS, Lucide icons, React Hook Form, TanStack Query, Recharts.
- **Backend Stack**: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, psycopg, Argon2id password hashing, pure-Python PDF generation with `fpdf2`.
- **Security & Authorization**: RBAC engine in FastAPI `Depends` for every protected operation with record-level scoping (`all`, `department`, `assigned`, `own`, `client`). Client multi-tenant isolation enforced server-side.

---

## 🔑 Required Credentials & Environment Variables

Create `.env` using `.env.example`:

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL pooled connection string for FastAPI runtime | `postgresql+psycopg://user:pass@host:5432/df_os?sslmode=require` |
| `DATABASE_DIRECT_URL` | Direct unpooled connection string for Alembic migrations | `postgresql+psycopg://user:pass@host:5432/df_os` |
| `SECRET_KEY` | 64-character random string for session tokens and signing | `openssl rand -hex 32` |
| `S3_ENDPOINT_URL` | Private S3-compatible storage endpoint (R2, AWS, MinIO) | `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_BUCKET_NAME` | S3 asset bucket name | `df-crm-assets` |
| `S3_ACCESS_KEY_ID` | Storage access key ID | `your-s3-key-id` |
| `S3_SECRET_ACCESS_KEY` | Storage secret access key | `your-s3-secret-key` |
| `EMAIL_PROVIDER` | Email delivery mechanism (`smtp`, `resend`, `console`) | `smtp` |
| `SMTP_HOST` / `RESEND_API_KEY` | Email provider credentials | `smtp.gmail.com` / `re_123` |

---

## 🚀 Quickstart & Development

### 1. Backend Setup (FastAPI & Database)
```bash
cd apps/api
# Initialize Python 3.12 virtualenv
uv venv --python 3.12
.\.venv\Scripts\activate

# Install dependencies
uv pip install -e ".[dev]"

# Run database migrations
alembic upgrade head

# Seed initial Super Admin, roles, catalogue and client 360 sample
python seed.py

# Run FastAPI backend
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup (Next.js)
```bash
cd apps/web
# Install dependencies
pnpm install

# Build production bundle
pnpm build

# Start local server
pnpm dev -p 3000
```

---

## 🧪 Testing

### Backend Unit & Integration Tests (pytest)
```bash
cd apps/api
.\.venv\Scripts\pytest -v
```

Includes test suites for:
1. `test_auth.py`: Login with Argon2id, cookie persistence, invalid credentials rejection, unauthenticated route protection.
2. `test_crm_finance.py`: Client 360 data retrieval, multi-service subscriptions, Indian GST tax calculations, and idempotent lead-to-client conversion.

---

## 🛡️ Seeded Credentials for Testing

- **Super Admin**: `admin@digitalfootprint.in`
- **Password**: `Admin@123456!`
- **Role**: `super_admin` (Full access to all modules and permission management)
- **Sample Client**: `Apex Global Technologies` (Code: `CLI-APEX-001`, GSTIN: `27AAACA1234F1Z1`)
