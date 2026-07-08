# MediMinder

Medicine Reminder & Adherence Bot — Telegram bot + admin dashboard for elderly patients, caregivers, supervisors, and doctors.

Full spec and build order: [docs/SPEC.md](docs/SPEC.md).

## Stack

Next.js (App Router, TypeScript) · Supabase (Postgres + Auth + RLS) · Tailwind CSS · Telegram Bot API (webhook) · external cron (cron-job.org) hitting `/api/cron/tick` every minute.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in real values, never commit this file
npm run dev
```

Database schema lives in [supabase/schema.sql](supabase/schema.sql) — run it in the Supabase SQL Editor for a fresh project.
