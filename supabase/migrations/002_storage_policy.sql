-- ============================================================
-- Storage: materials バケット作成 & ポリシー
-- Supabase Dashboard > Storage でバケット名 "materials" を作成後、
-- このSQLをSQL Editorで実行してください。
-- ============================================================

-- 認証済みユーザーはファイルを閲覧可能
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

create policy "materials storage: authenticated read"
  on storage.objects for select
  using (bucket_id = 'materials' and auth.role() = 'authenticated');

-- admin のみアップロード・削除可能
create policy "materials storage: admin insert"
  on storage.objects for insert
  with check (
    bucket_id = 'materials'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "materials storage: admin delete"
  on storage.objects for delete
  using (
    bucket_id = 'materials'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
