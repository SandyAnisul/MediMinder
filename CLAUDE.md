@AGENTS.md

# MediMinder — Claude Code Instructions

## What this project is
MediMinder is a Telegram bot + web admin dashboard that reminds elderly
patients to take medicines, confirms doses, escalates missed doses to
caregivers/supervisors, and tracks medicine stock.

Full spec: [docs/SPEC.md](docs/SPEC.md) (Part C is the technical spec, Part D is the build order).

Stack: Next.js App Router, TypeScript strict, Tailwind CSS, Supabase
(Postgres + Auth + RLS), Telegram Bot API (webhook), external cron
(cron-job.org) hitting `/api/cron/tick` every minute.

This is a separate project from Zelo — do not assume Zelo's conventions
apply here except where mirrored below.

## Rules

1. Never use `any` in TypeScript. Use `unknown` and add a TODO comment
   if the type is genuinely unclear.
2. `SUPABASE_SERVICE_ROLE_KEY` and `TELEGRAM_BOT_TOKEN` are server-only —
   never import `src/lib/supabase/admin.ts` into client components.
3. Only `/api/cron/tick` and `/api/telegram/webhook` are unauthenticated
   at the HTTP layer — they must instead verify `CRON_SECRET` /
   `TELEGRAM_WEBHOOK_SECRET` on every request. Every other API route
   verifies the admin session via the Supabase server client.
4. Never write CSS outside Tailwind utility classes. No inline styles.
5. RLS is the source of truth for data isolation between admins — never
   gate dashboard data access on client-side state alone.
6. Medicine names are stored and displayed in English always, regardless
   of the patient's chosen language. Only surrounding bot text is translated.
7. Idempotency matters everywhere doses/notifications are written: the
   unique index on `dose_events(medicine_id, scheduled_at)` and the
   `dose_deducted` flag must never be bypassed, since the cron tick can
   run the same logic more than once for the same minute.

## Schema changes

`supabase/schema.sql` is the single source of truth for the database schema.

1. Any change adding a table/column/index/policy: update `schema.sql` to
   the final desired state, and separately produce a delta SQL block
   labeled "Run this in Supabase SQL Editor before proceeding."
2. Any change that drops/alters existing structure: stop, tell the
   operator exactly what to run first, wait for confirmation, then
   update `schema.sql`.
3. `schema.sql` must stay idempotent — `create table if not exists`,
   `create index if not exists`, `drop policy if exists` + `create policy`,
   so the whole file can be re-run safely against any DB state.
4. Never run SQL against Supabase directly — always hand the operator
   SQL to paste into the SQL Editor.

## Database relationship rule

Never reference `auth.users` directly in any table FK except
`profiles.id` (the bridge). All other tables reference `public.profiles(id)`.

## Build order

Follow Part D of [docs/SPEC.md](docs/SPEC.md) — one step at a time, stop
and let the operator test after each step. Do not skip ahead to
deployment/cron/webhook steps before the operator confirms local testing
of the prior step.

## After every change

Run `npx tsc --noEmit` and fix all errors before considering a step done.
Do not run the dev server unless explicitly asked.
