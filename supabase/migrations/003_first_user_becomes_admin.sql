-- ============================================================
-- 最初に登録したユーザーを自動で admin にするトリガーへ更新
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  user_count integer;
begin
  select count(*) into user_count from public.profiles;
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when user_count = 0 then 'admin' else 'viewer' end
  );
  return new;
end;
$$;

-- ============================================================
-- 既存ユーザーを手動で admin に昇格させる場合のヘルパー
-- 下記の <user-email> を対象ユーザーのメールアドレスに書き換えて実行
-- ============================================================
-- update public.profiles set role = 'admin' where email = '<user-email>';
