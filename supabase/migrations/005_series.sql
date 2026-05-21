-- シリーズテーブル
create table if not exists public.series (
  id            uuid        primary key default gen_random_uuid(),
  title         text        not null,
  description   text,
  category      text,
  display_order int         not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid        not null references auth.users(id) on delete cascade
);

alter table public.series enable row level security;

create policy "series: public read"
  on public.series for select using (true);

create policy "series: admin insert"
  on public.series for insert
  with check (get_my_role() = 'admin');

create policy "series: admin update"
  on public.series for update
  using (get_my_role() = 'admin');

create policy "series: admin delete"
  on public.series for delete
  using (get_my_role() = 'admin');

-- sessions にシリーズ外部キーと順番カラムを追加
alter table public.sessions
  add column if not exists series_id    uuid references public.series(id) on delete set null,
  add column if not exists series_order int  not null default 0;
