-- =====================================================================
-- 1. جدول تتبع استخدام الزوار (Guest Usage)
-- =====================================================================
CREATE TABLE IF NOT EXISTS guest_usage (
  key TEXT NOT NULL,
  day TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (key, day)
);

CREATE INDEX IF NOT EXISTS idx_guest_usage_day ON guest_usage(day);

-- تفعيل حماية Row Level Security
ALTER TABLE guest_usage ENABLE ROW LEVEL SECURITY;

-- سياسة تسمح بالوصول الكامل لـ service_role
DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guest_usage' AND policyname = 'service_role_all_guest_usage'
  ) THEN
    CREATE POLICY service_role_all_guest_usage ON guest_usage FOR ALL USING (true) WITH CHECK (true);
  END IF;
END
$policy$;

-- =====================================================================
-- 2. دالة الزيادة الذرية (Atomic Upsert & Increment)
-- =====================================================================
CREATE OR REPLACE FUNCTION increment_guest_usage(p_key TEXT, p_day TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  new_used INTEGER;
BEGIN
  INSERT INTO guest_usage (key, day, used, updated_at)
  VALUES (p_key, p_day, 1, NOW())
  ON CONFLICT (key, day)
  DO UPDATE SET used = guest_usage.used + 1, updated_at = NOW()
  RETURNING used INTO new_used;
  
  RETURN new_used;
END;
$func$;

-- =====================================================================
-- 3. دالة التراجع الذري عند فشل الذكاء الاصطناعي (Atomic Rollback)
-- =====================================================================
CREATE OR REPLACE FUNCTION decrement_guest_usage(p_key TEXT, p_day TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  new_used INTEGER;
BEGIN
  UPDATE guest_usage
  SET used = GREATEST(0, used - 1), updated_at = NOW()
  WHERE key = p_key AND day = p_day
  RETURNING used INTO new_used;
  
  RETURN COALESCE(new_used, 0);
END;
$func$;
