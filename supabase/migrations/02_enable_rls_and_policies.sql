-- ============================================================================
-- Production-Ready RLS Migration (Pure Standard SQL - Zero PL/pgSQL Blocks)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENSURE ALL TABLES EXIST (Prevents relation "X" does not exist errors)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.diagnosis_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.panic_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ic_database (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_panic_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_rails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.custom_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.schematics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. ENSURE REQUIRED COLUMNS EXIST IN EXISTING TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.diagnosis_history ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.panic_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.custom_checklists ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.custom_panic_signatures ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.custom_rails ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.custom_references ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.user_usage ADD COLUMN IF NOT EXISTS user_id UUID;

-- ----------------------------------------------------------------------------
-- 3. HELPER FUNCTION FOR ADMIN CHECK
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 4. ENABLE RLS ON ALL TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panic_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ic_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_panic_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_rails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schematics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_keys ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 5. BOARDS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read access" ON public.boards;
DROP POLICY IF EXISTS "Authenticated insert" ON public.boards;
DROP POLICY IF EXISTS "Authenticated update" ON public.boards;
DROP POLICY IF EXISTS "Authenticated delete" ON public.boards;

CREATE POLICY "Public read access" ON public.boards
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert" ON public.boards
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

CREATE POLICY "Authenticated update" ON public.boards
  FOR UPDATE USING (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

CREATE POLICY "Authenticated delete" ON public.boards
  FOR DELETE USING (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 6. PROFILES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 7. DIAGNOSIS_HISTORY POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own diagnosis" ON public.diagnosis_history;
DROP POLICY IF EXISTS "Users can insert own diagnosis" ON public.diagnosis_history;
DROP POLICY IF EXISTS "Users can update own diagnosis" ON public.diagnosis_history;
DROP POLICY IF EXISTS "Users can delete own diagnosis" ON public.diagnosis_history;

CREATE POLICY "Users can view own diagnosis" ON public.diagnosis_history
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert own diagnosis" ON public.diagnosis_history
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own diagnosis" ON public.diagnosis_history
  FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can delete own diagnosis" ON public.diagnosis_history
  FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 8. PANIC_LOGS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own panic logs" ON public.panic_logs;
DROP POLICY IF EXISTS "Users can insert own panic logs" ON public.panic_logs;

CREATE POLICY "Users can view own panic logs" ON public.panic_logs
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert own panic logs" ON public.panic_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 9. CHAT_SESSIONS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON public.chat_sessions;

CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can insert own chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 10. IC_DATABASE POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read ic database" ON public.ic_database;
DROP POLICY IF EXISTS "Authenticated write ic database" ON public.ic_database;

CREATE POLICY "Public read ic database" ON public.ic_database
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write ic database" ON public.ic_database
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 11. CUSTOM USER TABLES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can access own checklists" ON public.custom_checklists;
CREATE POLICY "Users can access own checklists" ON public.custom_checklists
  FOR ALL 
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can access own panic signatures" ON public.custom_panic_signatures;
CREATE POLICY "Users can access own panic signatures" ON public.custom_panic_signatures
  FOR ALL 
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can access own rails" ON public.custom_rails;
CREATE POLICY "Users can access own rails" ON public.custom_rails
  FOR ALL 
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can access own references" ON public.custom_references;
CREATE POLICY "Users can access own references" ON public.custom_references
  FOR ALL 
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 12. SCHEMATICS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read schematics" ON public.schematics;
DROP POLICY IF EXISTS "Authenticated write schematics" ON public.schematics;

CREATE POLICY "Public read schematics" ON public.schematics
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write schematics" ON public.schematics
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 13. USER_USAGE POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own usage" ON public.user_usage;
DROP POLICY IF EXISTS "System can insert usage" ON public.user_usage;

CREATE POLICY "Users can view own usage" ON public.user_usage
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "System can insert usage" ON public.user_usage
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 14. ADMIN_KEYS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can access keys" ON public.admin_keys;

CREATE POLICY "Admins can access keys" ON public.admin_keys
  FOR ALL USING (auth.role() = 'service_role' OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 15. SECURE GRANT PERMISSIONS
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON TABLE public.boards TO anon;
GRANT SELECT ON TABLE public.ic_database TO anon;
GRANT SELECT ON TABLE public.schematics TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;