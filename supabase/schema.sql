-- MediMinder schema
-- Source of truth for the database. Idempotent: safe to re-run against any
-- state of the database (CREATE ... IF NOT EXISTS / DROP POLICY IF EXISTS + CREATE POLICY).
--
-- Run this in Supabase → SQL Editor.

-- ============================================================
-- profiles — one row per admin, bridges auth.users to app data
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

-- ============================================================
-- patients
-- ============================================================
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  timezone text not null default 'Asia/Kolkata',
  language text not null default 'en' check (language in ('en', 'hi', 'mr')),
  escalation_minutes int not null default 20,
  retry_count int not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists patients_admin_id_idx on public.patients(admin_id);

-- ============================================================
-- contacts — people around a patient
-- ============================================================
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  role text not null check (role in ('patient', 'caregiver', 'supervisor', 'doctor')),
  name text not null,
  phone text,
  telegram_chat_id bigint,
  telegram_username text,
  link_code text unique not null default encode(gen_random_bytes(6), 'hex'),
  linked_at timestamptz,
  active boolean not null default true
);

create index if not exists contacts_patient_id_idx on public.contacts(patient_id);
create index if not exists contacts_telegram_chat_id_idx on public.contacts(telegram_chat_id);

-- ============================================================
-- sessions — parts of the day, per patient
-- ============================================================
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  start_time time not null,
  sort_order int not null default 0
);

create index if not exists sessions_patient_id_idx on public.sessions(patient_id);

-- ============================================================
-- medicines
-- ============================================================
create table if not exists public.medicines (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete restrict,
  name text not null,
  dosage numeric not null,
  dosage_unit text not null,
  time_to_take time not null,
  frequency_type text not null check (
    frequency_type in ('everyday', 'alternate', 'weekly', 'monthly', 'specific_dates')
  ),
  frequency_config jsonb not null default '{}'::jsonb,
  stock_qty numeric not null default 0,
  low_stock_threshold numeric not null default 0,
  start_date date not null default current_date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists medicines_patient_id_idx on public.medicines(patient_id);
create index if not exists medicines_session_id_idx on public.medicines(session_id);

-- ============================================================
-- dose_events — one row per scheduled dose occurrence
-- ============================================================
create table if not exists public.dose_events (
  id uuid primary key default gen_random_uuid(),
  medicine_id uuid not null references public.medicines(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete restrict,
  scheduled_at timestamptz not null,
  status text not null default 'pending' check (
    status in ('pending', 'reminded', 'retried', 'taken', 'skipped', 'missed')
  ),
  reminder_sent_at timestamptz,
  retry_sent_at timestamptz,
  escalated_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by text check (confirmed_by in ('patient', 'caregiver', 'auto')),
  dose_deducted boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists dose_events_medicine_scheduled_idx
  on public.dose_events(medicine_id, scheduled_at);
create index if not exists dose_events_patient_id_idx on public.dose_events(patient_id);
create index if not exists dose_events_status_idx on public.dose_events(status);

-- ============================================================
-- notifications — audit log
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  dose_event_id uuid references public.dose_events(id) on delete set null,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  type text not null check (
    type in ('daily_schedule', 'reminder', 'retry', 'escalation', 'low_stock', 'weekly_report')
  ),
  sent_at timestamptz not null default now(),
  telegram_message_id bigint
);

create index if not exists notifications_dose_event_id_idx on public.notifications(dose_event_id);
create index if not exists notifications_contact_id_idx on public.notifications(contact_id);

-- ============================================================
-- app_settings — global fallback defaults (single row, key='defaults')
-- ============================================================
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null
);

insert into public.app_settings (key, value)
values (
  'defaults',
  '{"escalation_minutes":20,"retry_count":1,"daily_schedule_time":"07:00"}'::jsonb
)
on conflict (key) do nothing;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.contacts enable row level security;
alter table public.sessions enable row level security;
alter table public.medicines enable row level security;
alter table public.dose_events enable row level security;
alter table public.notifications enable row level security;
alter table public.app_settings enable row level security;

-- profiles: an admin can read/write only their own profile row
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- patients: owned directly via admin_id
drop policy if exists patients_owner on public.patients;
create policy patients_owner on public.patients
  for all using (admin_id = auth.uid()) with check (admin_id = auth.uid());

-- contacts: owned via patients.admin_id
drop policy if exists contacts_owner on public.contacts;
create policy contacts_owner on public.contacts
  for all using (
    exists (
      select 1 from public.patients p
      where p.id = contacts.patient_id and p.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.patients p
      where p.id = contacts.patient_id and p.admin_id = auth.uid()
    )
  );

-- sessions: owned via patients.admin_id
drop policy if exists sessions_owner on public.sessions;
create policy sessions_owner on public.sessions
  for all using (
    exists (
      select 1 from public.patients p
      where p.id = sessions.patient_id and p.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.patients p
      where p.id = sessions.patient_id and p.admin_id = auth.uid()
    )
  );

-- medicines: owned via patients.admin_id
drop policy if exists medicines_owner on public.medicines;
create policy medicines_owner on public.medicines
  for all using (
    exists (
      select 1 from public.patients p
      where p.id = medicines.patient_id and p.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.patients p
      where p.id = medicines.patient_id and p.admin_id = auth.uid()
    )
  );

-- dose_events: owned via patients.admin_id
drop policy if exists dose_events_owner on public.dose_events;
create policy dose_events_owner on public.dose_events
  for all using (
    exists (
      select 1 from public.patients p
      where p.id = dose_events.patient_id and p.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.patients p
      where p.id = dose_events.patient_id and p.admin_id = auth.uid()
    )
  );

-- notifications: owned via contacts -> patients.admin_id
drop policy if exists notifications_owner on public.notifications;
create policy notifications_owner on public.notifications
  for all using (
    exists (
      select 1 from public.contacts c
      join public.patients p on p.id = c.patient_id
      where c.id = notifications.contact_id and p.admin_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.contacts c
      join public.patients p on p.id = c.patient_id
      where c.id = notifications.contact_id and p.admin_id = auth.uid()
    )
  );

-- app_settings: readable/writable by any authenticated admin (single global row)
drop policy if exists app_settings_admin on public.app_settings;
create policy app_settings_admin on public.app_settings
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Note: the service_role key (used only in /api/cron/tick and /api/telegram/webhook)
-- bypasses RLS entirely — that is intentional and expected.
