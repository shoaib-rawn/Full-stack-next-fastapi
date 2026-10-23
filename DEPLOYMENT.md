# LedgerLite free deployment

LedgerLite uses four services because the Next.js frontend, FastAPI process,
PostgreSQL data and Redis rate-limit state have different runtime needs.

| Part | Provider | Production variable |
| --- | --- | --- |
| Next.js frontend | Vercel Hobby | `API_URL` |
| FastAPI backend | Render Free Web Service | backend variables below |
| PostgreSQL | Neon Free | `DATABASE_URL` |
| Redis | Upstash Redis Free | `REDIS_URL` |

## 1. Create PostgreSQL on Neon

1. Create a Neon project named `ledgerlite`.
2. Copy its pooled connection string.
3. Keep the pooled value for Render's `DATABASE_URL`.
4. Keep the direct value for Render's `DATABASE_URL_UNPOOLED` so Alembic does
   not run through transaction pooling. The application normalizes both URLs
   for asyncpg. Never commit either value.

## 2. Create Redis on Upstash

1. Create one Redis database in a nearby region.
2. Open the database's Connect page and copy the TLS Redis URL.
3. The value normally begins with `rediss://`; keep it for Render's
   `REDIS_URL`. Never commit it.

## 3. Deploy FastAPI on Render

1. Push this repository to GitHub.
2. In Render choose **New > Blueprint** and select the repository. The root
   `render.yaml` creates `ledgerlite-api`.
3. Enter `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `REDIS_URL`. The Blueprint
   already allows the deployed Vercel domain through `CORS_ORIGINS`.
4. Render generates `JWT_SECRET_KEY`. Do not copy it into Git.
5. The start command applies Alembic migrations before Uvicorn starts.
6. Verify both URLs:
   - `https://YOUR-API.onrender.com/health`
   - `https://YOUR-API.onrender.com/health/ready`

The free Render process sleeps after idle time, so its first request can be
slow. That is a hosting limit, not an application error.

## 4. Deploy Next.js on Vercel

1. Import the same GitHub repository in Vercel.
2. Set **Root Directory** to `frontend`.
3. Add `API_URL=https://YOUR-API.onrender.com` after Render gives you the
   backend URL.
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
requests. Vercel and Render should deploy only after the GitHub checks pass.
