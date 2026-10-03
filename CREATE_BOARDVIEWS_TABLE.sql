-- =====================================================
-- إنشاء جدول boardviews
-- =====================================================

-- حذف الجدول إذا كان موجود لإعادة إنشائه بالهيكل الصحيح
DROP TABLE IF EXISTS boardviews CASCADE;

CREATE TABLE boardviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  device_name TEXT NOT NULL,
  model TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  specifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes
CREATE INDEX IF NOT EXISTS idx_boardviews_user_id ON boardviews(user_id);
CREATE INDEX IF NOT EXISTS idx_boardviews_model ON boardviews(model);
CREATE INDEX IF NOT EXISTS idx_boardviews_brand ON boardviews(brand);
CREATE INDEX IF NOT EXISTS idx_boardviews_category ON boardviews(category);

-- إضافة comments
COMMENT ON TABLE boardviews IS 'جدول البوردفيو والمخططات الهندسية';

-- تفعيل RLS
ALTER TABLE boardviews ENABLE ROW LEVEL SECURITY;

-- إنشاء policy للقراءة العامة
DROP POLICY IF EXISTS "Public read access for boardviews" ON boardviews;
CREATE POLICY "Public read access for boardviews" ON boardviews FOR SELECT USING (true);

-- إنشاء policy للكتابة للمستخدمين المسجلين
DROP POLICY IF EXISTS "Users can insert boardviews" ON boardviews;
CREATE POLICY "Users can insert boardviews" ON boardviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- إنشاء policy للحذف للمستخدمين المسجلين
DROP POLICY IF EXISTS "Users can delete own boardviews" ON boardviews;
CREATE POLICY "Users can delete own boardviews" ON boardviews FOR DELETE USING (auth.uid() = user_id);

-- إنشاء trigger للتحديث التلقائي لـ updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_boardviews ON boardviews;
CREATE TRIGGER set_updated_at_boardviews BEFORE UPDATE ON boardviews
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
