CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.user_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_code TEXT NOT NULL,
  submitted_sql TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'error')),
  execution_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_code)
);

CREATE TABLE IF NOT EXISTS public.user_notes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_code TEXT NOT NULL,
  note_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_code)
);

ALTER TABLE public.user_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner access submissions" ON public.user_submissions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner access bookmarks" ON public.user_bookmarks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner access notes" ON public.user_notes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
