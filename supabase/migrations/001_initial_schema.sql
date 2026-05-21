-- ============================================================
-- profiles テーブル (auth.users を拡張)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  display_name text,
  role        text not null default 'viewer' check (role in ('viewer', 'admin')),
  created_at  timestamptz not null default now()
);

-- 新規ユーザー登録時に自動でprofileを作成するトリガー
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- sessions テーブル
-- ============================================================
create table if not exists public.sessions (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  category     text,
  thumbnail_url text,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- materials テーブル
-- ============================================================
create table if not exists public.materials (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.sessions(id) on delete cascade,
  title         text not null,
  file_path     text not null,
  display_order integer not null default 1,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- RLS 有効化
-- ============================================================
alter table public.profiles  enable row level security;
alter table public.sessions  enable row level security;
alter table public.materials enable row level security;

-- ============================================================
-- profiles ポリシー
-- ============================================================
-- 自分のprofileは自分だけ読み書き可能
create policy "profiles: own read"  on public.profiles for select using (auth.uid() = id);
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id);

-- ============================================================
-- sessions ポリシー
-- ============================================================
-- 認証済みユーザーは全セッションを閲覧可能
create policy "sessions: authenticated read" on public.sessions
  for select using (auth.role() = 'authenticated');

-- admin のみ作成・更新・削除可能
create policy "sessions: admin insert" on public.sessions
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "sessions: admin update" on public.sessions
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "sessions: admin delete" on public.sessions
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- materials ポリシー
-- ============================================================
create policy "materials: authenticated read" on public.materials
  for select using (auth.role() = 'authenticated');

create policy "materials: admin insert" on public.materials
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "materials: admin update" on public.materials
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "materials: admin delete" on public.materials
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
