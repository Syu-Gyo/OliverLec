-- ============================================================
-- 担当者(instructors)と公開予定日(published_at)を sessions に追加
-- ============================================================

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS instructors uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- sessions の SELECT ポリシーを更新
--   admin        → 常に全件閲覧可
--   instructors  → 担当セッションは公開前でも閲覧可
--   その他       → published_at が NULL（即時公開）または過去のものだけ閲覧可
DROP POLICY IF EXISTS "sessions: authenticated read" ON public.sessions;
DROP POLICY IF EXISTS "sessions: select"             ON public.sessions;

CREATE POLICY "sessions: select" ON public.sessions
  FOR SELECT USING (
    get_my_role() = 'admin'
    OR auth.uid() = ANY(instructors)
    OR published_at IS NULL
    OR published_at <= now()
  );

-- 管理者が全プロファイルを読めるポリシーを追加（担当者セレクタ用）
DROP POLICY IF EXISTS "profiles: admin read all" ON public.profiles;
CREATE POLICY "profiles: admin read all" ON public.profiles
  FOR SELECT USING (get_my_role() = 'admin');
