-- =====================================================================
-- Périnéa — Schéma Supabase (Postgres)
-- Calqué sur backend/api/models.py (Django) + intégration auth Supabase.
--
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- Idempotent : peut être relancé sans casser un schéma déjà créé.
-- =====================================================================

-- --- Types --------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'level_key') then
    create type level_key as enum ('debutant', 'intermediaire', 'avance');
  end if;
end$$;

-- =====================================================================
-- profiles : 1 ligne par utilisateur auth (remplace Profile + user OneToOne)
-- =====================================================================
create table if not exists public.profiles (
  id                            uuid primary key references auth.users (id) on delete cascade,
  name                          text not null default '',
  email                         text not null default '',
  age                           integer check (age is null or age >= 0),
  objective                     text not null default '',
  level_key                     level_key not null default 'debutant',
  training_frequency            text not null default '',
  symptoms                      jsonb not null default '[]'::jsonb,
  birth_context                 text not null default '',
  has_probe                     boolean,
  health_notes                  text not null default '',
  onboarding_completed          boolean not null default false,
  reminders                     boolean not null default true,
  notifications                 boolean not null default true,
  dark_mode                     boolean not null default false,
  monthly_goal_sessions_target  integer not null default 25,
  created_at                    timestamptz not null default now()
);

-- =====================================================================
-- device_status : OneToOne avec profile
-- =====================================================================
create table if not exists public.device_status (
  id            bigint generated always as identity primary key,
  profile_id    uuid not null unique references public.profiles (id) on delete cascade,
  device_name   text not null default 'Périnea',
  battery_pct   smallint not null default 85 check (battery_pct between 0 and 100),
  signal_level  text not null default 'Excellent',
  connected     boolean not null default true,
  updated_at    timestamptz not null default now()
);

-- =====================================================================
-- Tables de contenu (templates) — lecture publique, écriture admin
-- =====================================================================
create table if not exists public.exercise_templates (
  id                      bigint generated always as identity primary key,
  level_key               level_key not null,
  name                    text not null,
  description             text not null default '',
  icon                    text not null default '',
  duration_minutes        integer not null,
  timer_duration_seconds  integer not null default 10,
  sort_order              smallint not null default 0
);

create table if not exists public.session_templates (
  id                bigint generated always as identity primary key,
  level_key         level_key not null,
  title             text not null,
  duration_minutes  integer not null,
  color_hex         text not null default '#B9657C',
  sort_order        smallint not null default 0
);

create table if not exists public.tip_templates (
  id          bigint generated always as identity primary key,
  text        text not null,
  icon        text not null default '',
  sort_order  smallint not null default 0
);

create table if not exists public.achievement_templates (
  id           bigint generated always as identity primary key,
  code         text not null unique,
  title        text not null,
  description  text not null default '',
  icon         text not null default ''
);

-- =====================================================================
-- sessions : historique des séances par profil
-- =====================================================================
create table if not exists public.sessions (
  id                bigint generated always as identity primary key,
  profile_id        uuid not null references public.profiles (id) on delete cascade,
  title             text not null,
  level_key         level_key not null,
  duration_minutes  integer not null,
  duration_seconds  integer not null,
  exercises_count   integer not null default 0,
  started_at        timestamptz not null default now()
);

create index if not exists sessions_profile_started_idx
  on public.sessions (profile_id, started_at desc);

-- =====================================================================
-- user_achievements : succès débloqués (unique profil + succès)
-- =====================================================================
create table if not exists public.user_achievements (
  id              bigint generated always as identity primary key,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  achievement_id  bigint not null references public.achievement_templates (id) on delete cascade,
  earned          boolean not null default false,
  earned_at       timestamptz,
  unique (profile_id, achievement_id)
);

-- =====================================================================
-- Auto-création du profil à l'inscription (auth.users -> profiles)
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles            enable row level security;
alter table public.device_status       enable row level security;
alter table public.sessions            enable row level security;
alter table public.user_achievements   enable row level security;
alter table public.exercise_templates  enable row level security;
alter table public.session_templates   enable row level security;
alter table public.tip_templates       enable row level security;
alter table public.achievement_templates enable row level security;

-- profiles : chacun ne voit/modifie que sa propre ligne
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

-- device_status : lié au profil du user
drop policy if exists "device_status_own" on public.device_status;
create policy "device_status_own" on public.device_status
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- sessions : lié au profil du user
drop policy if exists "sessions_own" on public.sessions;
create policy "sessions_own" on public.sessions
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- user_achievements : lié au profil du user
drop policy if exists "user_achievements_own" on public.user_achievements;
create policy "user_achievements_own" on public.user_achievements
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Tables de contenu : lecture pour tout utilisateur connecté, pas d'écriture
drop policy if exists "exercise_templates_read" on public.exercise_templates;
create policy "exercise_templates_read" on public.exercise_templates
  for select to authenticated using (true);

drop policy if exists "session_templates_read" on public.session_templates;
create policy "session_templates_read" on public.session_templates
  for select to authenticated using (true);

drop policy if exists "tip_templates_read" on public.tip_templates;
create policy "tip_templates_read" on public.tip_templates
  for select to authenticated using (true);

drop policy if exists "achievement_templates_read" on public.achievement_templates;
create policy "achievement_templates_read" on public.achievement_templates
  for select to authenticated using (true);
