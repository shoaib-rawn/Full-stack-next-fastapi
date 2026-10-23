# LedgerLite

LedgerLite is a secure, multi-tenant accounting workspace built with Next.js
and FastAPI. Each organization manages its own team, customers, invoices,
payments and dashboard totals without exposing data to another tenant.

## What it demonstrates

- Next.js App Router, Server and Client Components, Suspense and BFF Route Handlers
- TypeScript, React Hook Form, Zod, TanStack Query, Axios and Chart.js
- FastAPI, Pydantic v2, async SQLAlchemy and Alembic
- PostgreSQL constraints, transactions, Decimal accounting and row locking
- Argon2 password hashing, JWT access/refresh rotation, RBAC and Redis rate limits
- Tenant-scoped customer, invoice, payment, team and reporting workflows
- Docker packaging, GitHub Actions CI and production health checks
- Neon pooled runtime connections, direct Alembic migrations and branch policy

## Architecture

```text
Browser
  -> Next.js frontend/BFF (Vercel)
  -> FastAPI API (Vercel Python runtime)
      -> PostgreSQL (Neon)
      -> Redis (Upstash)
```

Access and refresh tokens are stored in HttpOnly cookies. Browser components
call same-origin Next.js Route Handlers, which forward the access token to
FastAPI. Backend queries use the authenticated `organization_id` to enforce
tenant isolation.

## Local development

Start PostgreSQL and Redis:

```powershell
docker compose up -d
```

Create `backend/.env` from `backend/.env.example`, then run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\alembic.exe upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Create `frontend/.env.local` from `frontend/.env.example`, then run:

```powershell
cd frontend
npm install
npm run dev
```

- Frontend: `http://localhost:3000`
- Swagger UI: `http://127.0.0.1:8000/docs`
- Readiness: `http://127.0.0.1:8000/health/ready`
- Interview notebook: `http://localhost:3000/notebook`

## Quality checks

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest

cd ..\frontend
npm run typecheck
npm run lint
npm run build
```

The GitHub Actions workflow runs these checks automatically. See
[DEPLOYMENT.md](DEPLOYMENT.md) for the free-tier deployment journey.

## Source-code rights

Copyright (c) 2026 Shoaib Hassan. All rights reserved. This repository is
available for portfolio review only; copying, redistribution, modification,
publication, or commercial use requires prior written permission. See
[LICENSE](LICENSE).
