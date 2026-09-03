-- ============================================================================
-- Sentinel AI — Consolidated Database Schema & Signup Trigger Fix
-- ============================================================================
-- Safe to run on a FRESH project and on an EXISTING database.
-- Fully idempotent: every statement can be re-run without errors.
--
-- WHAT THIS FIXES (error 42P01: relation "profiles" does not exist):
--   The handle_new_user() trigger function referenced tables as bare
--   `profiles` / `user_preferences` and had no `SET search_path`, so when
--   Supabase's auth service fired the trigger the table names could not be
--   resolved. All references are now schema-qualified (`public.profiles`,
--   `public.user_preferences`) and the function pins
--   `SET search_path = public`.
--
-- Also includes:
--   - Schema qualification of every table, index, policy, and function.
--   - Idempotent policies (DROP POLICY IF EXISTS before CREATE POLICY).
--   - Missing INSERT policies for threat_signals and recommendations.
--   - A backfill that repairs users created while the trigger was broken.
-- ============================================================================


-- ============================================================================
-- 1. TABLES (correct order: parents before children)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ui_language TEXT DEFAULT 'en',
  analysis_language TEXT DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'url', 'qr', 'voice', 'privacy')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.threat_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('safe', 'suspicious', 'high-risk')),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  detected_language TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.threat_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_result_id UUID NOT NULL REFERENCES public.threat_results(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  explanation TEXT
);

CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_result_id UUID NOT NULL REFERENCES public.threat_results(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  priority INTEGER DEFAULT 1
);


-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_type ON public.scans(type);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_results_scan_id ON public.threat_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_threat_signals_result_id ON public.threat_signals(threat_result_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_result_id ON public.recommendations(threat_result_id);


-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- user_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- scans
DROP POLICY IF EXISTS "Users can view own scans" ON public.scans;
CREATE POLICY "Users can view own scans" ON public.scans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own scans" ON public.scans;
CREATE POLICY "Users can insert own scans" ON public.scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own scans" ON public.scans;
CREATE POLICY "Users can update own scans" ON public.scans
  FOR UPDATE USING (auth.uid() = user_id);

-- threat_results
DROP POLICY IF EXISTS "Users can view threat results for own scans" ON public.threat_results;
CREATE POLICY "Users can view threat results for own scans" ON public.threat_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE public.scans.id = public.threat_results.scan_id
        AND public.scans.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert threat results for own scans" ON public.threat_results;
CREATE POLICY "Users can insert threat results for own scans" ON public.threat_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE public.scans.id = public.threat_results.scan_id
        AND public.scans.user_id = auth.uid()
    )
  );

-- threat_signals
DROP POLICY IF EXISTS "Users can view signals for own results" ON public.threat_signals;
CREATE POLICY "Users can view signals for own results" ON public.threat_signals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.threat_results
      JOIN public.scans ON public.scans.id = public.threat_results.scan_id
      WHERE public.threat_results.id = public.threat_signals.threat_result_id
        AND public.scans.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert signals for own results" ON public.threat_signals;
CREATE POLICY "Users can insert signals for own results" ON public.threat_signals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.threat_results
      JOIN public.scans ON public.scans.id = public.threat_results.scan_id
      WHERE public.threat_results.id = public.threat_signals.threat_result_id
        AND public.scans.user_id = auth.uid()
    )
  );

-- recommendations
DROP POLICY IF EXISTS "Users can view recommendations for own results" ON public.recommendations;
CREATE POLICY "Users can view recommendations for own results" ON public.recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.threat_results
      JOIN public.scans ON public.scans.id = public.threat_results.scan_id
      WHERE public.threat_results.id = public.recommendations.threat_result_id
        AND public.scans.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert recommendations for own results" ON public.recommendations;
CREATE POLICY "Users can insert recommendations for own results" ON public.recommendations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.threat_results
      JOIN public.scans ON public.scans.id = public.threat_results.scan_id
      WHERE public.threat_results.id = public.recommendations.threat_result_id
        AND public.scans.user_id = auth.uid()
    )
  );


-- ============================================================================
-- 4. SIGNUP TRIGGER (THE FIX)
-- ============================================================================
-- SECURITY DEFINER: runs as the function owner (postgres), so it can write to
--   public.profiles regardless of the calling user's RLS restrictions.
-- SET search_path = public + fully qualified table names: the INSERTs can no
--   longer fail with 42P01 "relation profiles does not exist" when the
--   session search_path does not include public.
-- Column mapping (verified against table definitions):
--   profiles(id, full_name)                  — full_name is NOT NULL and is
--     always provided via COALESCE(..., ''), so the constraint is satisfied.
--   user_preferences(user_id, ui_language,
--                    analysis_language)       — all remaining columns have
--     defaults (created_at, updated_at).
--   Metadata keys raw_user_meta_data->>'full_name' and
--   ->>'preferred_language' match what the signup API sends in
--   options.data (full_name, preferred_language).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.user_preferences (user_id, ui_language, analysis_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
    'auto'
  );

  RETURN NEW;
END;
$$;

-- Recreate the trigger cleanly (idempotent). AFTER INSERT on auth.users so
-- the profile row is created as soon as Supabase Auth creates the user.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 5. BACKFILL — repair users created while the trigger was broken
-- ============================================================================
-- Any user that signed up while handle_new_user() was failing has no
-- profiles / user_preferences row. This inserts the missing rows once.
-- Safe to re-run: existing rows are skipped via the LEFT JOIN ... IS NULL.

INSERT INTO public.profiles (id, full_name)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.user_preferences (user_id, ui_language, analysis_language)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'preferred_language', 'en'), 'auto'
FROM auth.users u
LEFT JOIN public.user_preferences up ON up.user_id = u.id
WHERE up.user_id IS NULL;
