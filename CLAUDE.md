# ENP Tracker — CLAUDE.md

## What this project is
A nurse orientation tracking platform for Elite Nurse Partners, built for Amanda at WK Digital.
Managers and admins track nurses through a 50-week competency sign-off program across care facilities.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Wouter (routing), TanStack Query, Tailwind + shadcn/ui, Radix UI |
| Backend | Express 5, TypeScript, custom Bearer token auth (scrypt password hashing) |
| Database | PostgreSQL via Drizzle ORM (no migrations — uses `drizzle-kit push`) |
| Auth | Bearer token (32-byte random, 24h TTL, in-memory store with hourly cleanup) |
| Security | helmet, express-rate-limit (10/15 min on login) |
| Build | Custom `script/build.ts` — outputs `dist/index.cjs` + `dist/public/` |

---

## Project structure

```
server/         Express app, routes, auth, storage, seed
client/src/
  pages/        One file per route
  lib/auth.ts   Auth context + token management
deploy/
  enp.nginx.conf        Nginx config
  enp.supervisor.conf   Supervisor config
  setup.sh              One-time server setup script
shared/
  schema.ts     Drizzle schema + TypeScript types
```

---

## Environment variables

Required in `/opt/enp/.env` on the server:

```
NODE_ENV=production
PORT=8003
DATABASE_URL=postgresql://enp_user:<pass>@localhost:5432/enp_db
SESSION_SECRET=<64-byte hex>
```

---

## CI/CD

- **Trigger**: push to `main` → GitHub Actions (`.github/workflows/deploy.yml`)
- **Pipeline**: `npm run check` (TypeScript) → SSH deploy to Vultr
- **Deploy steps on server**: `git pull` → `npm install` → `npm run build` → `drizzle-kit push` → `supervisorctl restart enp`
- **Never deploy manually** unless the pipeline is broken

Server: `root@149.28.165.62` (Ubuntu 22.04, Vultr)
App directory: `/opt/enp`
Supervisor process: `enp`
Logs: `/var/log/enp.out.log`, `/var/log/enp.err.log`
URL: `https://enp.digitalp.com.au`

GitHub secret required: `VULTR_SSH_KEY` (private key for root@149.28.165.62)

---

## Roles

| Role | Access |
|------|--------|
| `nurse` | Own dashboard, mark weeks ready, add comments |
| `manager` | Sign-off queue, nurse progress across assigned facilities |
| `admin` | Full access — users, facilities, enrollments, programs |

---

## Key API routes

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/auth/login` | public | Rate-limited: 10/15 min |
| GET | `/api/auth/me` | bearer | |
| POST | `/api/auth/logout` | bearer | Deletes token from store |
| GET | `/api/nurse/dashboard` | nurse | Own enrollment + progress |
| GET | `/api/manager/dashboard` | manager/admin | All nurses across facilities |
| GET | `/api/manager/signoff-queue` | manager/admin | Items ready for sign-off |
| POST | `/api/progress/:id/ready` | auth | Nurse marks week ready |
| POST | `/api/progress/:id/signoff` | manager/admin | Signs off a week |
| POST | `/api/progress/:id/comments` | auth | Add comment to a week |
| GET/POST | `/api/admin/users` | admin | User management |
| GET/POST | `/api/admin/facilities` | admin | Facility management |
| GET/POST | `/api/admin/enrollments` | admin | Enrollment management |

---

## Security posture (as of last audit — 2026-03-31)

All critical items resolved:

1. **helmet()** — HTTP security headers on all responses
2. **Rate limiting** — express-rate-limit: 10 attempts / 15 min on `/api/auth/login`
3. **Token TTL** — 24h expiry on bearer tokens, hourly cleanup of expired tokens
4. **Input validation** — `parseIntParam()` NaN guard on all URL-param endpoints
5. **No stack traces to client** — production logs status code only
6. **No PII in logs** — notification messages use role-neutral text, no names
7. **No demo credentials** — removed from login page
8. **.env in .gitignore** — `.env`, `.env.local`, `.env.*.local` excluded

Password storage: scrypt with random salt, stored as `<hex-salt>:<hex-hash>`.

Known pre-existing TS errors (not introduced by audit fixes):
- `Set` spread patterns in routes.ts (lines ~185, ~552)
- `signedOffByName` type assignment (line ~195)
- `shared/schema.ts` boolean type issues

---

## Running locally

```bash
npm install
# Set DATABASE_URL in .env
npm run dev       # Express + Vite dev server on port 5000
npm run check     # TypeScript check
npm run db:push   # Push schema changes to DB
```
