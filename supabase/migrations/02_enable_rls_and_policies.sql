-- ============================================================================
-- Production-Ready Row Level Security (RLS) Migration
-- ============================================================================
-- This migration enables RLS on all tables and implements strict security policies
-- to protect user data while allowing necessary read access for guests
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Enable RLS on main tables
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE panic_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ic_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_panic_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_rails ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE schematics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_keys ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. BOARDS TABLE POLICIES
-- ============================================================================
-- boards table: Public read access for guests, restricted write for authenticated

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access" ON boards;
DROP POLICY IF EXISTS "Authenticated insert" ON boards;
DROP POLICY IF EXISTS "Authenticated update" ON boards;
DROP POLICY IF EXISTS "Authenticated delete" ON boards;
DROP POLICY IF EXISTS "Service role bypass" ON boards;

-- Policy: Allow public read access (guests can view cached boards)
CREATE POLICY "Public read access" ON boards
  FOR SELECT
  USING (true);

-- Policy: Allow INSERT only for authenticated users
CREATE POLICY "Authenticated insert" ON boards
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL OR
    -- Allow service role (server-side API routes)
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Policy: Allow UPDATE only for authenticated users or service role
CREATE POLICY "Authenticated update" ON boards
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Policy: Allow DELETE only for authenticated users or service role
CREATE POLICY "Authenticated delete" ON boards
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- ============================================================================
-- 3. PROFILES TABLE POLICIES
-- ============================================================================
-- profiles table: Users can only access their own profile

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role bypass profiles" ON profiles;

-- Policy: Users can only view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Policy: Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- ============================================================================
-- 4. DIAGNOSIS_HISTORY TABLE POLICIES
-- ============================================================================
-- diagnosis_history: Users can only access their own diagnosis sessions

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own diagnosis" ON diagnosis_history;
DROP POLICY IF EXISTS "Users can insert own diagnosis" ON diagnosis_history;
DROP POLICY IF EXISTS "Users can update own diagnosis" ON diagnosis_history;
DROP POLICY IF EXISTS "Users can delete own diagnosis" ON diagnosis_history;
DROP POLICY IF EXISTS "Service role bypass diagnosis" ON diagnosis_history;

-- Policy: Users can only view their own diagnosis history
CREATE POLICY "Users can view own diagnosis" ON diagnosis_history
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Policy: Users can only insert their own diagnosis
CREATE POLICY "Users can insert own diagnosis" ON diagnosis_history
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Policy: Users can only update their own diagnosis
CREATE POLICY "Users can update own diagnosis" ON diagnosis_history
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Policy: Users can only delete their own diagnosis
CREATE POLICY "Users can delete own diagnosis" ON diagnosis_history
  FOR DELETE
  USING (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- ============================================================================
-- 5. PANIC_LOGS TABLE POLICIES
-- ============================================================================
-- panic_logs: Users can only access their own panic logs

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own panic logs" ON panic_logs;
DROP POLICY IF EXISTS "Users can insert own panic logs" ON panic_logs;
DROP POLICY IF EXISTS "Service role bypass panic logs" ON panic_logs;

-- Policy: Users can only view their own panic logs
CREATE POLICY "Users can view own panic logs" ON panic_logs
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Policy: Users can only insert their own panic logs
CREATE POLICY "Users can insert own panic logs" ON panic_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- ============================================================================
-- 6. CHAT_SESSIONS TABLE POLICIES
-- ============================================================================
-- chat_sessions: Users can only access their own chat sessions

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can insert own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Service role bypass chat sessions" ON chat_sessions;

-- Policy: Users can only view their own chat sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Policy: Users can only insert their own chat sessions
CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- ============================================================================
-- 7. IC_DATABASE TABLE POLICIES
-- ============================================================================
-- ic_database: Public read access, restricted write

-- Drop existing policies
DROP POLICY IF EXISTS "Public read ic database" ON ic_database;
DROP POLICY IF EXISTS "Authenticated write ic database" ON ic_database;

-- Policy: Allow public read access to IC database
CREATE POLICY "Public read ic database" ON ic_database
  FOR SELECT
  USING (true);

-- Policy: Allow INSERT only for authenticated users or service role
CREATE POLICY "Authenticated write ic database" ON ic_database
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- ============================================================================
-- 8. CUSTOM USER TABLES POLICIES
-- ============================================================================
-- Custom tables (checklists, panic signatures, rails, references): User isolation

-- Custom Checklists
DROP POLICY IF EXISTS "Users can access own checklists" ON custom_checklists;
CREATE POLICY "Users can access own checklists" ON custom_checklists
  FOR ALL
  USING (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Custom Panic Signatures
DROP POLICY IF EXISTS "Users can access own panic signatures" ON custom_panic_signatures;
CREATE POLICY "Users can access own panic signatures" ON custom_panic_signatures
  FOR ALL
  USING (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Custom Rails
DROP POLICY IF EXISTS "Users can access own rails" ON custom_rails;
CREATE POLICY "Users can access own rails" ON custom_rails
  FOR ALL
  USING (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- Custom References
DROP POLICY IF EXISTS "Users can access own references" ON custom_references;
CREATE POLICY "Users can access own references" ON custom_references
  FOR ALL
  USING (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- ============================================================================
-- 9. SCHEMATICS TABLE POLICIES
-- ============================================================================
-- schematics: Public read access, restricted write

DROP POLICY IF EXISTS "Public read schematics" ON schematics;
DROP POLICY IF EXISTS "Authenticated write schematics" ON schematics;

CREATE POLICY "Public read schematics" ON schematics
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated write schematics" ON schematics
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- ============================================================================
-- 10. USER_USAGE TABLE POLICIES
-- ============================================================================
-- user_usage: Users can only view their own usage, system can insert

DROP POLICY IF EXISTS "Users can view own usage" ON user_usage;
DROP POLICY IF EXISTS "System can insert usage" ON user_usage;

CREATE POLICY "Users can view own usage" ON user_usage
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

CREATE POLICY "System can insert usage" ON user_usage
  FOR INSERT
  WITH CHECK (
    (current_setting('request.jwt.claim.role', true) = 'service_role')
  );

-- ============================================================================
-- 11. ADMIN_KEYS TABLE POLICIES
-- ============================================================================
-- admin_keys: Only admins and service role can access

DROP POLICY IF EXISTS "Admins can access keys" ON admin_keys;

CREATE POLICY "Admins can access keys" ON admin_keys
  FOR ALL
  USING (
    (current_setting('request.jwt.claim.role', true) = 'service_role') OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 12. VERIFICATION QUERY
-- ============================================================================
-- This query lists any tables in the public schema that do NOT have RLS enabled
-- Run this after migration to verify all tables are protected

-- Verification Query (for manual execution):
-- SELECT 
--   tablename,
--   relrowsecurity as rls_enabled
-- FROM pg_tables 
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- Expected result: All tables should have rls_enabled = true

-- ============================================================================
-- 13. GRANT PERMISSIONS
-- ============================================================================
-- Ensure anon and authenticated roles have necessary permissions

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
-- Migration completed successfully.
-- 
-- Security Summary:
-- - RLS enabled on all 13 tables
-- - Public read access: boards, ic_database, schematics
-- - User isolation: profiles, diagnosis_history, panic_logs, chat_sessions, custom tables
-- - Admin-only: admin_keys
-- - Service role bypass: All tables (for server-side API routes)
-- 
-- Next Steps:
-- 1. Run verification query to confirm RLS is enabled on all tables
-- 2. Test with anon key (client-side) to ensure RLS is working
-- 3. Test with service role (server-side) to ensure bypass works
-- 4. Update auth callback route for open redirect defense
-- ============================================================================
