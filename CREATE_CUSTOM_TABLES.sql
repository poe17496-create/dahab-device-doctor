-- =====================================================
-- إنشاء جداول Supabase للبيانات المخصصة
-- =====================================================

-- 1. جدول المسارات المخصصة لحاسبة الفولت
CREATE TABLE IF NOT EXISTS custom_rails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nominal_voltage DECIMAL(10,2) NOT NULL,
  max_safe_voltage DECIMAL(10,2) NOT NULL,
  recommended_voltage DECIMAL(10,2) NOT NULL,
  max_safe_current DECIMAL(10,2) NOT NULL,
  danger_zone DECIMAL(10,2) NOT NULL,
  first_suspects TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_custom_rails_user_id ON custom_rails(user_id);

-- تفعيل RLS
ALTER TABLE custom_rails ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يمكنهم قراءة مساراتهم الخاصة
CREATE POLICY "Users can read own custom rails" ON custom_rails
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: المستخدمون يمكنهم إضافة مسارات مخصصة
CREATE POLICY "Users can insert custom rails" ON custom_rails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: المستخدمون يمكنهم تعديل مساراتهم الخاصة
CREATE POLICY "Users can update own custom rails" ON custom_rails
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: المستخدمون يمكنهم حذف مساراتهم الخاصة
CREATE POLICY "Users can delete own custom rails" ON custom_rails
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger للتحديث التلقائي لـ updated_at
DROP TRIGGER IF EXISTS set_updated_at_custom_rails ON custom_rails;
CREATE TRIGGER set_updated_at_custom_rails BEFORE UPDATE ON custom_rails
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- 2. جدول بصمات البانيك المخصصة
CREATE TABLE IF NOT EXISTS custom_panic_signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL UNIQUE,
  component TEXT NOT NULL,
  affected_devices TEXT,
  symptom TEXT,
  fix_solution TEXT,
  danger_level TEXT NOT NULL CHECK (danger_level IN ('CRITICAL', 'HIGH', 'MEDIUM')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_custom_panic_signatures_user_id ON custom_panic_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_panic_signatures_keyword ON custom_panic_signatures(keyword);

-- تفعيل RLS
ALTER TABLE custom_panic_signatures ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يمكنهم قراءة بصماتهم الخاصة
CREATE POLICY "Users can read own custom signatures" ON custom_panic_signatures
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: المستخدمون يمكنهم إضافة بصمات مخصصة
CREATE POLICY "Users can insert custom signatures" ON custom_panic_signatures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: المستخدمون يمكنهم تعديل بصماتهم الخاصة
CREATE POLICY "Users can update own custom signatures" ON custom_panic_signatures
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: المستخدمون يمكنهم حذف بصماتهم الخاصة
CREATE POLICY "Users can delete own custom signatures" ON custom_panic_signatures
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger للتحديث التلقائي لـ updated_at
DROP TRIGGER IF EXISTS set_updated_at_custom_panic_signatures ON custom_panic_signatures;
CREATE TRIGGER set_updated_at_custom_panic_signatures BEFORE UPDATE ON custom_panic_signatures
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- 3. جدول المراجع المخصصة
CREATE TABLE IF NOT EXISTS custom_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_custom_references_user_id ON custom_references(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_references_category ON custom_references(category);

-- تفعيل RLS
ALTER TABLE custom_references ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يمكنهم قراءة مراجعهم الخاصة
CREATE POLICY "Users can read own custom references" ON custom_references
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: المستخدمون يمكنهم إضافة مراجع مخصصة
CREATE POLICY "Users can insert custom references" ON custom_references
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: المستخدمون يمكنهم تعديل مراجعهم الخاصة
CREATE POLICY "Users can update own custom references" ON custom_references
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: المستخدمون يمكنهم حذف مراجعهم الخاصة
CREATE POLICY "Users can delete own custom references" ON custom_references
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger للتحديث التلقائي لـ updated_at
DROP TRIGGER IF EXISTS set_updated_at_custom_references ON custom_references;
CREATE TRIGGER set_updated_at_custom_references BEFORE UPDATE ON custom_references
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- 4. جدول نقاط الفحص المخصصة
CREATE TABLE IF NOT EXISTS custom_checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  standard TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hardware', 'software')),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_custom_checklist_items_user_id ON custom_checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_checklist_items_category ON custom_checklist_items(category);

-- تفعيل RLS
ALTER TABLE custom_checklist_items ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يمكنهم قراءة نقاط فحصهم الخاصة
CREATE POLICY "Users can read own custom checklist items" ON custom_checklist_items
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: المستخدمون يمكنهم إضافة نقاط فحص مخصصة
CREATE POLICY "Users can insert custom checklist items" ON custom_checklist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: المستخدمون يمكنهم تعديل نقاط فحصهم الخاصة
CREATE POLICY "Users can update own custom checklist items" ON custom_checklist_items
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: المستخدمون يمكنهم حذف نقاط فحصهم الخاصة
CREATE POLICY "Users can delete own custom checklist items" ON custom_checklist_items
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger للتحديث التلقائي لـ updated_at
DROP TRIGGER IF EXISTS set_updated_at_custom_checklist_items ON custom_checklist_items;
CREATE TRIGGER set_updated_at_custom_checklist_items BEFORE UPDATE ON custom_checklist_items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- 5. جدول سجلات البانيك المحفوظة
CREATE TABLE IF NOT EXISTS saved_panic_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  log_text TEXT NOT NULL,
  results JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_saved_panic_logs_user_id ON saved_panic_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_panic_logs_created_at ON saved_panic_logs(created_at DESC);

-- تفعيل RLS
ALTER TABLE saved_panic_logs ENABLE ROW LEVEL SECURITY;

-- Policy: المستخدمون يمكنهم قراءة سجلاتهم الخاصة
CREATE POLICY "Users can read own panic logs" ON saved_panic_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: المستخدمون يمكنهم إضافة سجلات
CREATE POLICY "Users can insert panic logs" ON saved_panic_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: المستخدمون يمكنهم حذف سجلاتهم الخاصة
CREATE POLICY "Users can delete own panic logs" ON saved_panic_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Comment للجداول
COMMENT ON TABLE custom_rails IS 'جدول المسارات المخصصة لحاسبة الفولت';
COMMENT ON TABLE custom_panic_signatures IS 'جدول بصمات البانيك المخصصة';
COMMENT ON TABLE custom_references IS 'جدول المراجع الهندسية المخصصة';
COMMENT ON TABLE custom_checklist_items IS 'جدول نقاط الفحص المخصصة';
COMMENT ON TABLE saved_panic_logs IS 'جدول سجلات البانيك المحفوظة';
