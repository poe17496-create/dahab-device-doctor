-- إنشاء جدول النسخ الاحتياطية
CREATE TABLE IF NOT EXISTS database_backups (
  id TEXT PRIMARY KEY,
  backup_data JSONB NOT NULL,
  description TEXT,
  tables_count INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  size_estimate TEXT DEFAULT '0 KB',
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول سجل عمليات الاستعادة
CREATE TABLE IF NOT EXISTS restore_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_id TEXT NOT NULL,
  restored_by TEXT DEFAULT 'admin',
  tables_restored TEXT[] DEFAULT ARRAY[]::TEXT[],
  results JSONB NOT NULL,
  success BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes للبحث السريع
CREATE INDEX IF NOT EXISTS idx_database_backups_created_at ON database_backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_restore_logs_backup_id ON restore_logs(backup_id);
CREATE INDEX IF NOT EXISTS idx_restore_logs_created_at ON restore_logs(created_at DESC);

-- إضافة comment للجداول
COMMENT ON TABLE database_backups IS 'جدول تخزين النسخ الاحتياطية لقاعدة البيانات';
COMMENT ON TABLE restore_logs IS 'جدول سجل عمليات استعادة النسخ الاحتياطية';

-- إضافة policy (Row Level Security) للجداول
ALTER TABLE database_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE restore_logs ENABLE ROW LEVEL SECURITY;

-- حذف الـ policies القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Admin only can access database_backups" ON database_backups;
DROP POLICY IF EXISTS "Admin only can access restore_logs" ON restore_logs;

-- السماح للمشرف فقط بالوصول
CREATE POLICY "Admin only can access database_backups" ON database_backups
  FOR ALL USING (auth.uid() IS NULL OR auth.role() = 'service_role');

CREATE POLICY "Admin only can access restore_logs" ON restore_logs
  FOR ALL USING (auth.uid() IS NULL OR auth.role() = 'service_role');
