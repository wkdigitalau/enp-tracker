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
| Security | helmet, express-rate-limit |
| Email | SendGrid (`@sendgrid/mail`) |
| Scheduler | node-cron (monthly emails) |
| Build | Custom `script/build.ts` — outputs `dist/index.cjs` + `dist/public/` |

---

## Project structure

```
server/
  index.ts       Express app, helmet, trust proxy, error handler, scheduler start
  routes.ts      All API routes, auth middleware, token store
  storage.ts     IStorage interface + DatabaseStorage implementation
  email.ts       SendGrid helpers — invite email, monthly nurse/manager emails
  scheduler.ts   node-cron job (monthly emails, 1st of month 00:10 UTC)
  seed.ts        Dev/initial DB seed
client/src/
  pages/         One file per route
  lib/auth.tsx   Auth context + token management (localStorage)
  lib/queryClient.ts  apiRequest helper, setAuthToken/clearAuthToken
deploy/
  enp.nginx.conf        Nginx config
  enp.supervisor.conf   Supervisor config
  setup.sh              One-time server setup script
shared/
  schema.ts      Drizzle schema + TypeScript types
```

---

## Environment variables

Required in `/opt/enp/.env` on the server:

```
NODE_ENV=production
PORT=8003
DATABASE_URL=postgresql://enp_user:<pass>@localhost:5432/enp_db
SESSION_SECRET=<64-byte hex>
SENDGRID_API_KEY=SG.<key>
SENDGRID_FROM=noreply@digitalp.com.au
```

> **Note for other projects:** `SENDGRID_FROM` is always `noreply@digitalp.com.au`. Each project gets its own `SENDGRID_API_KEY` — never share keys between projects.

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

## Auth & user lifecycle

### How auth works
- Login returns a 32-byte random Bearer token stored in an in-memory `Map<token, { userId, expiresAt }>`
- Token TTL: 24 hours. Expired tokens purged hourly via `setInterval`
- Token stored in `localStorage` on the client (`enp_auth_token`)
- Every API request sends `Authorization: Bearer <token>`
- `getUserIdFromRequest()` validates the token and expiry on every request
- `requireRole(...roles)` middleware enforces role-based access

### User states
A user is always in exactly one of these states:

| State | Condition | Can log in? |
|-------|-----------|-------------|
| **Pending invite** | `invite_token IS NOT NULL` | No — blocked at login with a clear message |
| **Active** | `invite_token IS NULL`, `archived_at IS NULL` | Yes |
| **Archived** | `archived_at IS NOT NULL` | No — blocked at login with a clear message |

### User creation flow (invite-only — no admin-set passwords)
1. Admin creates user (name, email, role — no password)
2. Server generates 32-byte invite token, stores with 72h expiry, sends invite email via SendGrid
3. User clicks link → `/accept-invite?token=xxx` page
4. User sets password → server clears token, sets real password hash, issues auth token → user is immediately logged in
5. `lastLoginAt` recorded on every successful login

### Resend invite
- Admin clicks Mail icon on any active user
- Server regenerates token (72h), resets password hash to random placeholder, resends invite email
- Works for both pending-invite users (refresh expired link) and active users (force password reset via invite)

### Archive / unarchive
- Admin clicks Archive icon → `archived_at` set → user blocked from login, excluded from monthly emails
- Admin clicks Unarchive icon (in archived view) → `archived_at` cleared → user can log in again
- Archived users' data is preserved — enrollments, progress, comments all intact

### Password storage
scrypt with random 16-byte salt, stored as `<hex-salt>:<hex-hash>` (64 bytes each).

### Sanitization
`sanitizeUser()` in `routes.ts` strips `passwordHash`, `inviteToken`, `inviteExpiresAt` from every client-facing response. Always use this — never spread a raw `User` object into a response.

---

## Email (SendGrid)

### Setup per project
1. Add sender `noreply@digitalp.com.au` in SendGrid (already verified — shared sender)
2. Create a new API key in SendGrid with **Mail Send** permission only
3. Add to server `.env`: `SENDGRID_API_KEY=SG.<new-key>` and `SENDGRID_FROM=noreply@digitalp.com.au`
4. Never share API keys between projects

### Emails sent by this app

| Trigger | Recipients | Content |
|---------|-----------|---------|
| Admin creates user | New user | Invite link (72h expiry) |
| Admin resends invite | User | Fresh invite link (resets password) |
| 1st of month, 00:10 UTC | All active nurses | Last login, overdue items, upcoming 4 weeks, login link |
| 1st of month, 00:10 UTC | All active managers | Last login, overdue items by nurse, login link |

### Manual trigger (testing)
```
POST /api/admin/email/send-monthly
Authorization: Bearer <admin-token>
```

### HTML safety
All user-controlled values (names, competency titles) are escaped via `esc()` before interpolation into email HTML.

---

## Key API routes

### Auth (public / rate-limited)
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/login` | Rate-limited 10/15 min. Checks archived + pending-invite before password verify |
| POST | `/api/auth/logout` | Deletes token from store |
| GET | `/api/auth/me` | Returns sanitized user for stored token |
| GET | `/api/auth/accept-invite` | Validates invite token, returns user name |
| POST | `/api/auth/accept-invite` | Rate-limited 10/15 min. Sets password, clears token, returns auth token |

### Nurse
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/nurse/dashboard` | Own enrollment + progress |

### Manager / Admin
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/manager/dashboard` | All nurses across assigned facilities |
| GET | `/api/manager/signoff-queue` | Items with status `ready` |
| POST | `/api/progress/:id/ready` | Nurse marks week ready |
| POST | `/api/progress/:id/signoff` | Manager/admin signs off |
| POST | `/api/progress/:id/comments` | Any authenticated user |

### Admin only
| Method | Path | Notes |
|--------|------|-------|
| GET/POST | `/api/admin/users` | List active+archived / create user (triggers invite email) |
| POST | `/api/admin/users/:id/resend-invite` | Regenerate invite, reset password hash |
| PATCH | `/api/admin/users/:id/password` | Admin-set password override |
| PATCH | `/api/admin/users/:id/archive` | Archive user |
| PATCH | `/api/admin/users/:id/unarchive` | Reactivate user |
| GET/POST | `/api/admin/facilities` | Facility management |
| GET/POST | `/api/admin/enrollments` | Enrollment management |
| POST | `/api/admin/email/send-monthly` | Manually trigger monthly emails |

---

## Security posture (as of last audit — 2026-03-31)

1. **helmet()** — HTTP security headers on all responses
2. **`app.set("trust proxy", 1)`** — required behind nginx for rate limiter to read correct IP from `X-Forwarded-For`
3. **Rate limiting** — 10/15 min on `/api/auth/login` and `/api/auth/accept-invite`
4. **Token TTL** — 24h expiry, hourly in-memory cleanup
5. **Auth order in login** — archived check → invite-pending check → verifyPassword (this order matters: placeholder password hashes have no colon and will throw if `verifyPassword` is called first)
6. **`parseIntParam()`** — NaN guard on all URL-param endpoints
7. **`sanitizeUser()`** — strips sensitive fields from all client responses
8. **No stack traces to client** — production error handler logs status code only
9. **No PII in logs** — event types and IDs only
10. **HTML escaping in emails** — `esc()` applied to all user-controlled values
11. **scrypt password hashing** — random salt, 64-byte output
12. **`.env` in `.gitignore`**

---

## Running locally

```bash
npm install
# Set DATABASE_URL in .env
npm run dev       # Express + Vite dev server on port 5000
npm run check     # TypeScript check
npm run db:push   # Push schema changes to DB
```
