-- Sentinel AI Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ui_language TEXT DEFAULT 'en',
  analysis_language TEXT DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scans
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'url', 'qr', 'voice', 'privacy')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Threat results
CREATE TABLE IF NOT EXISTS threat_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('safe', 'suspicious', 'high-risk')),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  detected_language TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Threat signals
CREATE TABLE IF NOT EXISTS threat_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_result_id UUID NOT NULL REFERENCES threat_results(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  explanation TEXT
);

-- Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_result_id UUID NOT NULL REFERENCES threat_results(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  priority INTEGER DEFAULT 1
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_type ON scans(type);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_threat_results_scan_id ON threat_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_threat_signals_result_id ON threat_signals(threat_result_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_result_id ON recommendations(threat_result_id);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE threat_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own scans" ON scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans" ON scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scans" ON scans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view threat results for own scans" ON threat_results
  FOR SELECT USING (EXISTS (SELECT 1 FROM scans WHERE scans.id = threat_results.scan_id AND scans.user_id = auth.uid()));

CREATE POLICY "Users can insert threat results for own scans" ON threat_results
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM scans WHERE scans.id = threat_results.scan_id AND scans.user_id = auth.uid()));

CREATE POLICY "Users can view signals for own results" ON threat_signals
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM threat_results
    JOIN scans ON scans.id = threat_results.scan_id
    WHERE threat_results.id = threat_signals.threat_result_id AND scans.user_id = auth.uid()
  ));

CREATE POLICY "Users can view recommendations for own results" ON recommendations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM threat_results
    JOIN scans ON scans.id = threat_results.scan_id
    WHERE threat_results.id = recommendations.threat_result_id AND scans.user_id = auth.uid()
  ));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO user_preferences (user_id, ui_language, analysis_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
    'auto'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
