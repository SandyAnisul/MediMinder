# MediMinder — Medicine Reminder & Adherence Bot
### Full Build Specification + Beginner Setup Guide (hand off to Claude Code)

> **Product in one line:** A Telegram bot (with a web admin dashboard) that reminds elderly patients to take their medicines, confirms whether each dose was actually taken, escalates missed doses to caregivers/supervisors, and tracks medicine stock so refills happen on time.

This document has **four parts**:

- **Part A — Plain-language overview** (what we're building)
- **Part B — Beginner setup guide** (every account and tool, step by step)
- **Part C — The technical spec** (give this to Claude Code to build)
- **Part D — Build order** (the exact sequence to drive Claude Code)

---

# PART A — Plain-language overview

## A.1 The people (roles)
There is **one Admin** (you) at the top. The admin logs into a web dashboard with email + password and manages everything. The admin creates all other people.

Per **patient**, there is a circle of contacts, each with their own Telegram account:

| Role | How many | Gets notified about |
|------|----------|---------------------|
| **Patient** | 1 | Their own reminders + confirmation questions + daily schedule |
| **Caregiver** | 1 or more | Daily schedule, missed-dose escalations, low-stock alerts |
| **Supervisor** | 1 or more | Missed-dose escalations |
| **Reporting Doctor** | 1 | Weekly adherence summary (taken vs missed) |
| **Admin** | 1 (you) | Low-stock alerts; sees everything in the dashboard |

## A.2 Sessions (dividing the day)
Each patient's day is split into **N parts** the admin chooses (e.g. 4 or 5). Each part is a **Session** with a **name** (e.g. *Before Breakfast, After Breakfast, Lunch, Dinner*) and a **start time**. Sessions are set per patient.

## A.3 Medicines
Each medicine belongs to a patient and has: name, dosage, the session it belongs to, the exact time to be taken, a **frequency** (Everyday / Alternate days / Weekly / Monthly / Specific dates), current stock quantity, and a low-stock threshold.

## A.4 What the bot does
1. **Daily schedule** — each morning, sends the patient (+ caregiver) the day's medicines grouped by session.
2. **Per-dose reminder** — at each medicine's time, messages the patient (+ caregiver) with two buttons: **✅ Taken** / **⏭️ Skip**.
3. **Follow-up + escalation** — if no reply within **20 minutes** (a setting), it re-asks once (1 retry). If still no reply 20 minutes after that, it marks the dose **missed** and escalates to caregiver + supervisor.
4. **Stock tracking** — a confirmed "Taken" reduces stock by the dosage. "Skip" or "missed" does **not** reduce stock. When stock hits the threshold, it alerts caregiver + admin.
5. **Doctor report** — a weekly summary of taken vs missed goes to the doctor; the admin sees the same summary in the dashboard.

## A.5 Settings
- **Language** (per patient): Hindi / English / Marathi. All bot messages use the chosen language, **but medicine names always stay in English.**
- **Time zone** (per patient): chosen in the admin panel (default `Asia/Kolkata`).
- **Escalation timing** (per patient, default 20 min; retries = 1).
- **Low-stock threshold** (per medicine).

---

# PART B — Beginner setup guide

You will create **5 free accounts** and install **2 tools**. Follow these in order. Total time ~60–90 minutes the first time. You do **not** need to write any code — Claude Code writes it; you do the account setup and paste in "keys" (secret passwords for services).

> **Golden rule about keys:** A "key" or "token" is like a password for a service. Never paste keys into a chat, a public website, or a file that goes to GitHub. In this project, keys live only in two safe places: your local `.env.local` file (which Git is told to ignore) and Vercel's "Environment Variables" screen.

## B.1 Accounts to create (all free tier)

### 1. GitHub (stores your code)
- Go to **github.com** → Sign up. Verify your email.
- Later, Claude Code will create a repository (a "repo") here for you.

### 2. Supabase (your database + admin login system)
- Go to **supabase.com** → Sign in with GitHub.
- Click **New project**. Give it a name like `mediminder`. Choose a strong **database password** (save it in a password manager). Region: pick **Mumbai (ap-south-1)** for lowest latency in India.
- Wait ~2 minutes for it to build.
- You'll need three values later, found under **Project Settings → API**:
  - **Project URL** (looks like `https://xxxx.supabase.co`)
  - **anon public key** (safe for the browser)
  - **service_role key** (SECRET — server only, never in the browser)

### 3. Telegram + BotFather (creates the bot)
- Install **Telegram** on your phone. Create an account with your phone number.
- In Telegram, search for **@BotFather** (the official one has a blue check).
- Send `/newbot`. It asks for:
  - a **name** (display name, e.g. `MediMinder`)
  - a **username** (must end in `bot`, e.g. `mediminder_care_bot`)
- BotFather replies with a **token** like `123456789:AAE...`. This is your **TELEGRAM_BOT_TOKEN** — keep it secret.
- Optional but nice: send `/setdescription`, `/setabouttext`, and `/setuserpic` to BotFather to brand the bot.

### 4. Vercel (hosts the website + bot online, free)
- Go to **vercel.com** → Sign up with GitHub.
- You'll connect your GitHub repo here later and it deploys automatically.

### 5. cron-job.org (the "heartbeat" that runs every minute — free)
- Go to **cron-job.org** → Sign up.
- This service will "ping" your app once a minute so it can check which reminders are due. (Explained in Part C. You'll set it up after the app is deployed.)

## B.2 Tools to install on your computer

### 1. Node.js (needed only if you use the npm install method of Claude Code)
- Go to **nodejs.org**, download the **LTS** version, install it.
- Verify: open your terminal and run `node --version` — you want **v18 or higher**.

> **What's a terminal?** On **Mac**: press Cmd+Space, type "Terminal", Enter. On **Windows**: press the Windows key, type "PowerShell", Enter.

### 2. Claude Code (the AI that builds the app)
Anthropic's **native installer is the recommended method** (no Node.js needed for Claude Code itself):

- **macOS / Linux:** `curl -fsSL https://claude.ai/install.sh | bash`
- **Windows (PowerShell):** `irm https://claude.ai/install.ps1 | iex`
- **Homebrew (Mac/Linux):** `brew install --cask claude-code`

Or, if you prefer npm (needs Node.js 18+): `npm install -g @anthropic-ai/claude-code`

Verify with `claude --version`. First run: type `claude` and sign in through the browser with your Claude subscription. *(Never use `sudo` with the npm install.)*

## B.3 The 10-minute account checklist (fill this in before building)
Keep this in a private note (a password manager is ideal). You'll paste these into `.env.local` and Vercel:

```
SUPABASE_URL=              (Supabase → Settings → API → Project URL)
SUPABASE_ANON_KEY=         (Supabase → Settings → API → anon public)
SUPABASE_SERVICE_ROLE_KEY= (Supabase → Settings → API → service_role — SECRET)
TELEGRAM_BOT_TOKEN=        (from BotFather)
CRON_SECRET=               (make up a long random string, e.g. from a password generator)
TELEGRAM_WEBHOOK_SECRET=   (make up another long random string)
ADMIN_EMAIL=kaulsandeep@gmail.com
APP_URL=                   (filled in after first Vercel deploy, e.g. https://mediminder.vercel.app)
```

> The admin **password** is NOT stored here. You'll create the admin login once, directly in Supabase (Part D, Step 8), then change it after first sign-in.

---

# PART C — Technical specification (for Claude Code)

> **Instruction to Claude Code:** Build the app described below. Ask me before running any command that spends money or deletes data. Use the exact table/column names given. After each milestone in Part D, stop and let me test.

## C.1 Tech stack (chosen for a beginner: one codebase, one deploy)
- **Framework:** Next.js (App Router, TypeScript). It serves **both** the admin dashboard (web pages) **and** the Telegram bot (API routes) from one project.
- **Database & Auth:** Supabase (Postgres + Supabase Auth for admin email/password login + Row Level Security).
- **Hosting:** Vercel.
- **Telegram:** Bot API via **webhook** (Telegram calls our `/api/telegram/webhook` endpoint whenever a user interacts).
- **Scheduler ("heartbeat"):** an external cron (cron-job.org) hits `/api/cron/tick` **every minute**, protected by `CRON_SECRET`. This is what makes time-based reminders work on serverless hosting. *(Alternative: Vercel Cron or Supabase pg_cron — but external cron is the most reliable free minute-level trigger for a beginner.)*
- **UI:** Tailwind CSS + a simple component set (e.g. shadcn/ui). Clean, large-text, mobile-friendly admin.
- **i18n:** a small message dictionary (`/lib/i18n/{en,hi,mr}.ts`) for all bot text; medicine names are never translated.

## C.2 Environment variables
Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `CRON_SECRET`, `TELEGRAM_WEBHOOK_SECRET`.
Public (browser-safe, prefix `NEXT_PUBLIC_`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Also: `APP_URL`, `ADMIN_EMAIL`.

## C.3 Data model (Postgres / Supabase)

> Use `timestamptz` for all instants (store UTC; convert to the patient's timezone in code). Use Supabase `auth.users` for admin credentials; app data below.

**`profiles`** — one row per admin (linked to Supabase Auth)
| column | type | notes |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| email | text | admin email |
| full_name | text | |
| role | text | `'admin'` (room for future roles) |
| created_at | timestamptz | default now() |

**`patients`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| admin_id | uuid FK→profiles.id | owner |
| name | text | |
| timezone | text | default `'Asia/Kolkata'` |
| language | text | `'en' \| 'hi' \| 'mr'`, default `'en'` |
| escalation_minutes | int | default `20` |
| retry_count | int | default `1` |
| active | boolean | default true |
| created_at | timestamptz | |

**`contacts`** — the people around a patient
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| patient_id | uuid FK→patients.id | |
| role | text | `'patient' \| 'caregiver' \| 'supervisor' \| 'doctor'` |
| name | text | |
| phone | text | optional, informational |
| telegram_chat_id | bigint | filled in after they link (see C.6) |
| telegram_username | text | optional |
| link_code | text unique | short code used once to connect Telegram |
| linked_at | timestamptz | null until linked |
| active | boolean | default true |

**`sessions`** — parts of the day, per patient
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| patient_id | uuid FK | |
| name | text | e.g. "Before Breakfast" |
| start_time | time | local to patient timezone |
| sort_order | int | order in the day |

**`medicines`**
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| patient_id | uuid FK | |
| session_id | uuid FK→sessions.id | which session |
| name | text | **always English** |
| dosage | numeric | quantity per dose (e.g. 1, 0.5, 5) |
| dosage_unit | text | e.g. "tablet", "ml" |
| time_to_take | time | local time |
| frequency_type | text | `'everyday' \| 'alternate' \| 'weekly' \| 'monthly' \| 'specific_dates'` |
| frequency_config | jsonb | see below |
| stock_qty | numeric | current units on hand |
| low_stock_threshold | numeric | alert at/below this |
| start_date | date | first day active |
| end_date | date | nullable (open-ended) |
| active | boolean | default true |
| created_at | timestamptz | |

**`frequency_config` shapes:**
- `everyday`: `{}`
- `alternate`: `{ "anchor_date": "2026-07-08" }` (due on days an even number of days from anchor)
- `weekly`: `{ "weekdays": [1,4] }` (0=Sun … 6=Sat)
- `monthly`: `{ "day_of_month": 15 }`
- `specific_dates`: `{ "dates": ["2026-07-10","2026-07-25"] }`

**`dose_events`** — one row per scheduled dose occurrence (the adherence log + the reminder state machine)
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| medicine_id | uuid FK | |
| patient_id | uuid FK | denormalized for easy queries |
| session_id | uuid FK | |
| scheduled_at | timestamptz | the exact due instant |
| status | text | see state machine below |
| reminder_sent_at | timestamptz | |
| retry_sent_at | timestamptz | |
| escalated_at | timestamptz | |
| confirmed_at | timestamptz | |
| confirmed_by | text | `'patient' \| 'caregiver' \| 'auto'` |
| dose_deducted | boolean | default false (prevents double stock deduction) |
| created_at | timestamptz | |

Add a **unique index** on `(medicine_id, scheduled_at)` so the same dose is never created twice.

**`notifications`** — audit log (optional but recommended)
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| dose_event_id | uuid FK nullable | |
| contact_id | uuid FK | recipient |
| type | text | `'daily_schedule' \| 'reminder' \| 'retry' \| 'escalation' \| 'low_stock' \| 'weekly_report'` |
| sent_at | timestamptz | |
| telegram_message_id | bigint | for later editing/deleting |

**`app_settings`** — global fallback defaults (single row)
| key | value(jsonb) |
|---|---|
| defaults | `{ "escalation_minutes":20, "retry_count":1, "daily_schedule_time":"07:00" }` |

### Row Level Security (RLS)
- Enable RLS on all app tables.
- Policy: an admin can read/write only rows where the chain leads back to `admin_id = auth.uid()`. (For `contacts/sessions/medicines/dose_events`, join through `patients.admin_id`.)
- The **service role key** (used only in server API routes: webhook, cron) bypasses RLS — that's intended, and it is never exposed to the browser.

## C.4 The dose state machine

```
pending  ──(time reached)──►  reminded  ──(Taken)──►  taken   (deduct stock)
                                  │
                                  ├──(Skip)────────►  skipped (no deduction)
                                  │
                                  └──(no reply, escalation_minutes)──► retried
retried  ──(Taken)──► taken   ──(Skip)──► skipped
retried  ──(no reply, escalation_minutes again)──► missed (escalate; no deduction)
```

- **taken**: set `confirmed_at`, `confirmed_by`; if `dose_deducted=false`, decrement `medicines.stock_qty` by `dosage`, set `dose_deducted=true`; then run low-stock check.
- **skipped / missed**: never deduct stock.
- **missed**: send escalation message to all caregivers + supervisors of that patient.

## C.5 The cron tick (`GET /api/cron/tick`, runs every minute)
Reject the request unless header/query `secret == CRON_SECRET`. Then, in order:

1. **Materialize doses (once/day per medicine):** For each active medicine whose frequency says it is **due today** (in the patient's timezone) and whose `[start_date, end_date]` covers today, ensure a `dose_events` row exists at today's `time_to_take` with status `pending`. (Idempotent via the unique index.)
2. **Send due reminders:** For `pending` doses where `scheduled_at <= now`: send the **reminder** message (buttons ✅ Taken / ⏭️ Skip) to patient + caregivers; set `status='reminded'`, `reminder_sent_at=now`; log to `notifications`.
3. **Retry:** For `reminded` doses where `now - reminder_sent_at >= escalation_minutes` and `retry_sent_at is null`: resend; set `status='retried'`, `retry_sent_at=now`.
4. **Escalate:** For `retried` doses where `now - retry_sent_at >= escalation_minutes`: set `status='missed'`, `escalated_at=now`; send **escalation** message to caregivers + supervisors.
5. **Daily schedule:** Once per patient per day at `daily_schedule_time` (patient tz): build the session-by-session list of today's doses and send to patient + caregivers.
6. **Weekly report:** On the configured weekday/time, per patient, compute last 7 days taken vs missed and send to the doctor; the dashboard reads the same computation.

> Keep each tick fast and idempotent. If a tick is missed, the next one catches up because everything is driven by timestamps, not by "was I running at exactly that second."

## C.6 Telegram linking flow (how a contact's phone connects to the bot)
1. Admin adds a contact → app generates a short `link_code` and shows a deep link: `https://t.me/<bot_username>?start=<link_code>`.
2. Admin shares that link with the person (WhatsApp/SMS). The person taps it, Telegram opens the bot, and Telegram automatically sends `/start <link_code>`.
3. The webhook receives `/start <link_code>`, finds the matching contact, stores `telegram_chat_id` and `linked_at`, and replies (in the patient's language): "You're connected as {role} for {patient name}."

## C.7 Telegram webhook (`POST /api/telegram/webhook`)
- Verify Telegram's secret header equals `TELEGRAM_WEBHOOK_SECRET` (set when registering the webhook).
- Handle **messages**: `/start <code>` (linking), `/help`, `/today` (patient asks for today's schedule).
- Handle **callback queries** (button taps): payload encodes `doseEventId` + action (`taken`/`skip`). Update the dose per the state machine, then **edit the original message** to show the outcome (e.g. "✅ Marked as taken at 9:04 AM") so buttons can't be tapped twice.
- Always `answerCallbackQuery` so the user's tap spinner stops.

## C.8 Message templates (i18n — English shown; provide `hi` & `mr` equivalents)
Medicine names are inserted verbatim (English). Times shown in patient's timezone.

- **Daily schedule:**
  `Good morning, {patient}. Today's medicines:` then per session: `🕗 {session} ({start_time})` and lines `• {medicine} — {dosage}{unit} at {time}`.
- **Reminder:**
  `⏰ Time for your medicine: {medicine} — {dosage}{unit} ({session}). Have you taken it?` + buttons `✅ Taken` / `⏭️ Skip`.
- **Retry:**
  `Reminder again: {medicine} — {dosage}{unit}. Please confirm.` + same buttons.
- **Escalation (to caregiver/supervisor):**
  `⚠️ {patient} has not confirmed {medicine} ({dosage}{unit}) due at {time}. Please check in.`
- **Low stock (to caregiver + admin):**
  `📦 Low stock: {medicine} for {patient} has {stock_qty}{unit} left (threshold {threshold}). Please refill.`
- **Weekly report (to doctor):**
  `📊 Weekly adherence for {patient} ({date range}): Taken {t}/{total} ({pct}%). Missed {m}. Skipped {s}.`

## C.9 Admin dashboard (web pages)
- **/login** — Supabase email/password. Redirect to /patients when authed.
- **/patients** — list of patients (name, active, quick stats). "Add patient".
- **/patients/[id]** — tabbed detail:
  - **Overview** — today's doses & statuses (live-ish), adherence % this week.
  - **Contacts** — add/edit patient/caregiver(s)/supervisor(s)/doctor; each shows link status + "copy invite link".
  - **Sessions** — set number of sessions; name + start time + order for each.
  - **Medicines** — CRUD with all fields incl. frequency builder (a friendly UI for the 5 frequency types), stock, threshold.
  - **Adherence log** — filterable table of `dose_events` (date, medicine, status, confirmed_by).
  - **Settings** — timezone, language, escalation_minutes, retry_count, daily schedule time.
- **/settings** — global defaults; change admin password link.
- **Accessibility:** large fonts, high contrast, simple layouts (end contacts are elderly, but the *admin* UI is for you — still keep it clean).

## C.10 Security & safety requirements
- `service_role` key and `TELEGRAM_BOT_TOKEN` used **only** in server routes; never shipped to the browser.
- Cron endpoint and webhook both reject requests lacking the correct secret.
- RLS enforced so one admin can never read another admin's patients.
- `.env.local` is git-ignored; real secrets live in Vercel env vars.
- Admin password created once in Supabase; **must be changed on first login**; never committed to code.
- Validate all inputs; parameterized queries only (Supabase client handles this).
- Idempotency everywhere (unique index on doses; `dose_deducted` flag) so retries/duplicate ticks never double-count stock or double-notify.

## C.11 Acceptance tests (Claude Code should verify these)
1. Admin can log in, create a patient with 4 sessions, add a caregiver, add an everyday medicine with stock 10.
2. Linking: opening the invite link connects the caregiver; `telegram_chat_id` is stored.
3. At the medicine's time, patient + caregiver receive the reminder with buttons.
4. Tapping **Taken** edits the message, logs `taken`, and stock drops from 10 → 9.
5. Ignoring the reminder for 20 min triggers a retry; ignoring 20 more min marks **missed** and escalates to caregiver + supervisor; stock stays unchanged.
6. Setting stock threshold at 2 and taking doses down to it fires a low-stock alert to caregiver + admin.
7. Weekly report to doctor shows correct taken/missed counts; dashboard shows the same numbers.
8. Switching patient language to Hindi changes bot text but keeps medicine names in English.

---

# PART D — Build order (drive Claude Code in this sequence)

Do these one at a time. After each, test before moving on.

**Step 0 — Open a project folder & start Claude Code.**
Make a folder (e.g. `mediminder`), open a terminal there, run `claude`. Paste **Part C** of this document into Claude Code as the spec, and tell it to follow this build order.

**Step 1 — Scaffold.** Ask Claude Code to create a Next.js + TypeScript + Tailwind app, add the Supabase client, and set up the folder structure. It should also create `.env.local.example` (no real secrets) and a `.gitignore` that ignores `.env.local`.

**Step 2 — Database.** Have Claude Code generate the SQL for all tables, indexes, and RLS policies in **C.3**. You then run this SQL in **Supabase → SQL Editor** (Claude Code will give you the exact SQL to paste). Paste your real Supabase URL/keys into `.env.local`.

**Step 3 — Admin auth + dashboard shell.** Build /login and the /patients list using Supabase Auth. Test locally (`npm run dev`, open http://localhost:3000).

**Step 4 — Patient/contacts/sessions/medicines CRUD.** Build the dashboard tabs in **C.9**. Test creating a full patient by hand.

**Step 5 — Telegram webhook + linking.** Build `/api/telegram/webhook` and the linking flow (**C.6/C.7**). 

**Step 6 — Deploy to Vercel & register webhook.**
- Have Claude Code push the repo to GitHub, then import it in Vercel and add all env vars from **B.3**.
- After the first deploy you get an `APP_URL`. Set it in env vars.
- Register the Telegram webhook (Claude Code gives you the one-time command/URL to call, using `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET`, pointing at `{APP_URL}/api/telegram/webhook`).
- Test linking a contact via the invite link.

**Step 7 — Cron tick + reminders/escalation/stock.** Build `/api/cron/tick` (**C.5**) and the state machine (**C.4**). Then in **cron-job.org**, create a job that GETs `{APP_URL}/api/cron/tick?secret={CRON_SECRET}` **every 1 minute**. Run the acceptance tests in **C.11** (you can temporarily set a medicine's time to 2 minutes from now, and `escalation_minutes` to 1–2, to test fast).

**Step 8 — Create the first admin login.**
In **Supabase → Authentication → Users → Add user**, create:
- email: `kaulsandeep@gmail.com`
- password: (your temporary password)
Then insert a matching row in `profiles` (Claude Code provides the SQL). Log in, then **change the password** from the dashboard.

**Step 9 — Daily schedule + weekly doctor report + i18n.** Add the daily schedule send, the weekly report, and the Hindi/Marathi message dictionaries. Verify test #8.

**Step 10 — Polish.** Low-stock alerts, audit log view, accessibility pass, and a final run through all acceptance tests.

---

## Appendix — Quick glossary for beginners
- **Repo / GitHub:** an online folder that stores your code and its history.
- **Deploy / Vercel:** putting your app on the internet so it has a public web address.
- **Environment variable / key:** a secret setting (like a password) the app reads at runtime; stored safely, never in code.
- **Webhook:** a URL Telegram calls automatically whenever someone interacts with your bot.
- **Cron:** a timer that runs a task on a schedule (here, once a minute).
- **RLS (Row Level Security):** database rules that stop one user from seeing another user's data.
- **Serverless:** hosting where code runs on demand (not always-on) — which is why we need an external cron for timed reminders.

*End of specification.*
