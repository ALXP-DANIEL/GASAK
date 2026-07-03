# GASAK Management System

Esports org management portal for **GASAK** (Malaysian MLBB organization): squads, players, recruitment, calendar, tournaments, scrims, announcements, and a public shop with guest checkout — all role-gated for Admin / Leader / Member / Seller.

## Stack

- **Next.js 16** (App Router, Turbopack, `proxy.ts`) + TypeScript
- **Tailwind CSS v4** + **shadcn/ui** (radix-lyra style, Phosphor icons)
- **Better Auth** (email/password, admin plugin for user management, reset password)
- **Drizzle ORM** + **PostgreSQL** (Docker `dev_postgres`; falls back to embedded PGlite without `DATABASE_URL`)
- React Hook Form + Zod, TanStack Query, FullCalendar, Recharts
- Local image uploads served via `/api/files` (swap for UploadThing/S3 later)

## Getting started

```bash
# 1. Start PostgreSQL (service lives in ~/Developer/Services/docker-compose.yml)
docker compose -f ~/Developer/Services/docker-compose.yml up -d postgres

# 2. Environment — .env already contains:
#    NEXT_PUBLIC_SITE_URL, AUTH_SECRET, DATABASE_URL=postgres://app:app@localhost:5432/gasak

# 3. Install, push schema, seed demo data
npm install
npm run db:push
npm run db:seed

# 4. Run
npm run dev
```

### Demo accounts

| Role   | Email            | Password  |
| ------ | ---------------- | --------- |
| Admin  | admin@gasak.gg   | admin123  |
| Leader | leader@gasak.gg  | leader123 |
| Member | member@gasak.gg  | member123 |
| Seller | seller@gasak.gg  | seller123 |

## Modules

**Public site** — Home, About, Squads (+detail), Players, Recruitment (application form), Shop (guest checkout → order tracking `/shop/order/GSK-XXXXXX` with payment-proof upload), Contact.

**Dashboard** (`/dashboard`, session required via `proxy.ts`, role checks in every layout/page/action):

| Area | Admin | Leader | Member | Seller |
| --- | --- | --- | --- | --- |
| Overview stats | org-wide | own squad | own squad | revenue + chart |
| Squads | CRUD, archive/restore, logo/banner, roster assignment | view own (My Squad) | view own | — |
| Players | manage everyone | squad members | own profile | — |
| Recruitment | assign leaders, approve/reject | review assigned, trial/accept/reject | — | — |
| Calendar | all events | own squad events | view | — |
| Tournaments / Scrims | record + delete | own squad | view | — |
| Announcements | global + squad | own squad | read | — |
| Products / Orders | full access | — | — | CRUD, verify payments, status flow |
| Users | create, set role, delete | — | — | — |

**Order flow:** Pending → Waiting Payment (proof uploaded) → Paid (seller verifies, stock deducted) → Processing → Completed, with Cancel (restocks paid orders). Payments: DuitNow QR, Bank Transfer (FPX planned).

**Recruitment flow:** Applied → Under Review (assigned to leader) → Trial → Accepted / Rejected.

## Notes

- **Password reset:** no SMTP configured — reset links are printed to the server console (see `sendResetPassword` in `src/lib/auth.ts`).
- **Uploads** are stored in `./uploads` (gitignored) and served by `src/app/api/files/[...path]/route.ts`.
- **Database scripts:** `npm run db:push` (sync schema), `npm run db:seed` (idempotent), `npm run db:studio` (Drizzle Studio).
- Remove `DATABASE_URL` from `.env` to run on embedded PGlite (no Docker needed).
