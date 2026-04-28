# Book of Memories

Production-oriented Next.js 14 + Prisma application for publishing and moderating memorial submissions about people connected with the SVO.

## Stack

- Next.js 14 (App Router, Server Actions)
- TypeScript
- Prisma + PostgreSQL
- NextAuth (credentials)
- Vercel Blob (optional for image upload)
- PM2 or Docker for deploy

## Key features

- Public pages: `/`, `/about`, `/memory`, `/memory/[slug]`, `/submit`, `/submission-status`
- Public submission flow for `Person`
- Submission status access via one-time email code
- Admin moderation panel `/admin`
- Admin management of published cards (edit + hide/restore)
- Password reset flow `/account/forgot-password` → `/account/reset-password`
- Upload API with mime/extension/signature/size checks
- Rate limits for login, submit, upload, code send/verify, forgot/reset password
- Health endpoint: `GET /api/health`

---

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL 14+

---

## Environment variables

Use `.env.example` as a template.

### Mandatory

- `DATABASE_URL`
- `AUTH_SECRET` (minimum 32 characters)

### Mandatory in production (strongly required)

- `NEXTAUTH_URL` (public HTTPS URL)
- `APP_URL` (fallback absolute URL)
- `ALLOWED_ORIGINS` (server action origins, comma-separated)

### Runtime (VPS)

- `HOST` (recommended `127.0.0.1` behind nginx)
- `PORT` (for Next.js server)

### Optional

- `BLOB_READ_WRITE_TOKEN` (for direct upload into Vercel Blob)
- `PASSWORD_RESET_EMAIL_WEBHOOK_URL`
- `SUBMISSION_ACCESS_EMAIL_WEBHOOK_URL`

> Secrets are never rendered into client bundle unless explicitly prefixed with `NEXT_PUBLIC_` (not used here).

---

## Local setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run env:check
npm run dev
```

---

## Troubleshooting: `Authentication failed against database server`

If you see Prisma runtime errors like:

- `Authentication failed against database server`
- `` provided database credentials for `(not available)` are not valid``

check the following:

1. `DATABASE_URL` is set in `.env` (not only in `.env.example`).
2. Username/password/host/port/database in `DATABASE_URL` are correct.
3. PostgreSQL is reachable from your app host (`localhost` inside Docker is not your host machine).
4. Run `npm run env:check` to validate env values and test a real DB connection before starting Next.js.

Example local URL:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bookofmemories?schema=public"
```

---

## Prisma and PostgreSQL deploy flow

### First deploy (clean DB)

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build
npm run start -- -H 127.0.0.1 -p 3000
```

### Subsequent deploys

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build
pm2 restart bookofmemories
```

### Migration policy

- Production: **only** `prisma migrate deploy`
- Local development: `prisma migrate dev`
- Avoid `prisma db push` in production

### Seed usage

Seed is for local/demo data and wipes existing data:

```bash
npm run prisma:seed
```

### Create/rotate admin user

```bash
npm run admin:create -- --email=admin@example.com --password='StrongPass123' --name='Main Admin' --role=ADMIN
```

(also supports `--role=MODERATOR`)

---

## Upload and images

- Upload endpoint: `POST /api/upload`
- Limits: up to 5 MB
- Allowed mime/ext: jpg/jpeg/png/webp/gif/avif
- Content validated by magic bytes
- Rate limited by IP
- If `BLOB_READ_WRITE_TOKEN` is missing, API returns `503` and UI can fallback to URL-based image input

---

## Moderation flow

1. Public user sends submission via `/submit`
2. Submission gets `pending`
3. Moderator/admin opens `/admin`
4. Set status: `approved` / `needs_revision` / `rejected`
5. On `approved`, `Person` record is published and linked to submission

### Published cards management

- `/admin` now includes a dedicated list of participant cards
- Moderators/admins can open `/admin/persons/[id]/edit` to update card content and publication status
- Hide action is implemented as soft delete (`Person.deletedAt`), so hidden cards are not shown on public pages

---

## Submission status confirmation flow

1. User requests code on `/submission-status`
2. Code (6 digits) sent to email, TTL 15 minutes
3. Code hash only is stored in DB
4. On success, temporary access session cookie is issued
5. Email is marked verified for linked submissions

Security hardening included:
- resend cooldown
- brute-force protection (`attemptCount`)
- IP rate limit for send/verify

---

## Password reset flow

1. User submits email at `/account/forgot-password`
2. Raw token is generated; DB stores only SHA-256 hash
3. Token TTL = 1 hour
4. Reset URL sent via webhook
5. Token is single-use (`usedAt` is persisted)

---

## Production build and run

```bash
npm run build
npm run start -- -H 127.0.0.1 -p 3000
```

Health check:

```bash
curl -f http://127.0.0.1:3000/api/health
```

---

## PM2 deploy

Included file: `ecosystem.config.js`

```bash
npm ci
npm run build
npm run prisma:migrate:deploy
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Docker deploy

Included files: `Dockerfile`, `.dockerignore`

```bash
docker build -t bookofmemories:latest .
docker run --env-file .env -p 3000:3000 bookofmemories:latest
```

---

## Recommended VPS deploy order (Node + PostgreSQL + nginx + PM2)

1. Configure PostgreSQL and create DB/user
2. Fill `.env` with production values (`NEXTAUTH_URL` must be public HTTPS domain)
3. `npm ci`
4. `npm run prisma:generate`
5. `npm run prisma:migrate:deploy`
6. `npm run build`
7. `pm2 start ecosystem.config.js`
8. Configure nginx reverse proxy to `127.0.0.1:3000`
9. Validate `/api/health`

---

## Troubleshooting

- `Invalid environment configuration` on startup:
  - check missing/invalid env vars (`AUTH_SECRET`, `DATABASE_URL`, URLs)
- Build fails fetching Google Fonts:
  - app uses system font fallback; no external font fetch required
- Upload fails with `503`:
  - set `BLOB_READ_WRITE_TOKEN` or use URL-based photo field
- Server actions blocked in production:
  - add your domain to `ALLOWED_ORIGINS`
- `prisma migrate deploy` fails:
  - verify DB permissions and existing migration history
