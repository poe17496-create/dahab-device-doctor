-- جدول تتبع تجارب الزائريين بناءً على عنوان IP
-- لمنع استغلال التصفح الخفي ومسح الكوكيز

-- إنشاء جدول guest_trials
CREATE TABLE IF NOT EXISTS guest_trials (
  ip TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  last_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء index على last_date لتحسين الأداء في الاستعلامات اليومية
CREATE INDEX IF NOT EXISTS idx_guest_trials_last_date ON guest_trials(last_date);

-- إنشاء trigger لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_guest_trials_updated_at
    BEFORE UPDATE ON guest_trials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- تعليق على الجدول
COMMENT ON TABLE guest_trials IS 'جدول تتبع تجارب الزائريين بناءً على عنوان IP لمنع استغلال التصفح الخفي';
COMMENT ON COLUMN guest_trials.ip IS 'عنوان IP للزائر (Primary Key)';
COMMENT ON COLUMN guest_trials.count IS 'عدد المحاولات المستخدمة اليوم';
COMMENT ON COLUMN guest_trials.last_date IS 'تاريخ آخر استخدام';
