# LedgerLite free deployment

LedgerLite uses four services because the Next.js frontend, FastAPI process,
PostgreSQL data and Redis rate-limit state have different runtime needs.

| Part | Provider | Production variable |
| --- | --- | --- |
| Next.js frontend | Vercel Hobby | `API_URL` |
| FastAPI backend | Vercel Python runtime | backend variables below |
| PostgreSQL | Neon Free | `DATABASE_URL` |
| Redis | Upstash Redis Free | `REDIS_URL` |

## 1. Create PostgreSQL on Neon

1. Create a Neon project named `ledgerlite`.
2. Copy its pooled connection string.
3. Keep the pooled value for the backend's `DATABASE_URL`.
4. Keep the direct value for `DATABASE_URL_UNPOOLED` so Alembic does
   not run through transaction pooling. The application normalizes both URLs
   for asyncpg. Never commit either value.

## 2. Create Redis on Upstash

1. Create one Redis database in a nearby region.
2. Open the database's Connect page and copy the TLS Redis URL.
3. The value normally begins with `rediss://`; keep it for Vercel's
   `REDIS_URL`. Never commit it.

## 3. Deploy FastAPI on Vercel

1. Create a separate Vercel project named `ledgerlite-api` with `backend` as
   its source root. Vercel detects `app/main.py` as FastAPI.
2. Add `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `REDIS_URL`, and a strong
   `JWT_SECRET_KEY` as production secrets.
3. Add `ENVIRONMENT=production` and
   `CORS_ORIGINS=["https://frontend-dun-nine-f6zfeizlan.vercel.app"]`.
4. Apply Alembic migrations separately before deploying. Serverless startup
   must not run schema migrations for every function instance.
5. Disable Vercel Authentication for the API production deployment. LedgerLite
   still protects business endpoints with JWT, RBAC, and tenant scoping.
6. Verify:
   - `https://ledgerlite-api-tau.vercel.app/health`
   - `https://ledgerlite-api-tau.vercel.app/health/ready`

## 4. Deploy Next.js on Vercel

1. Import the same GitHub repository in Vercel.
2. Set **Root Directory** to `frontend`.
3. Add `API_URL=https://ledgerlite-api-tau.vercel.app`.
4. Add `NEXT_PUBLIC_LEARNING_MODE=false`.
5. Deploy and copy the final `https://...vercel.app` URL.

## 5. Connect the final origins

The current production origin is:

```text
CORS_ORIGINS=["https://frontend-dun-nine-f6zfeizlan.vercel.app"]
```

Redeploy the backend after changing this value for a future custom domain.
Although normal app data flows server-to-server through
the Next.js BFF, keeping an explicit origin allow-list documents the browser
boundary and supports the public health display.

## Neon project tooling

- `neon.ts` keeps the branch policy in source control.
- `.neon` and `.env.local` are local and ignored because they contain the
  project link and connection values.
- `.agents/skills/` and `skills-lock.json` pin the official Neon guidance for
  contributors.
- `.codex/config.toml` and `.vscode/mcp.json` use OAuth and pin MCP access to
  this Neon project without storing an API key.

## 6. Final live test

1. Open the Vercel URL in a private browser window.
2. Sign up a new organization.
3. Log in and confirm the cookies are HttpOnly and Secure.
4. Create a customer, invoice and payment.
5. Confirm dashboard totals and tenant isolation with a second organization.
6. Test logout and logout-all.
7. Confirm `/health/ready` reports both database and Redis as `ok`.

## Automatic checks

`.github/workflows/ci.yml` runs backend migrations/tests and
frontend typecheck, ESLint and production build on relevant pushes and pull
requests. Production deployments should follow successful GitHub checks.
