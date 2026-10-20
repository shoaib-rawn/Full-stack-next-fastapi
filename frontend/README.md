# LedgerLite Frontend

Next.js 16 App Router frontend for the LedgerLite FastAPI backend.

## Run locally

Start the backend from `ledgerlite/backend`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Start the frontend from `ledgerlite/frontend`:

```powershell
npm.cmd run dev
```

Open `http://localhost:3000`.

## Checks

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Copy `.env.example` to `.env.local` only when the backend URL differs from the local default.
