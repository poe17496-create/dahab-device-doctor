-- =====================================================================
-- جدول تتبع استخدام الزوار (Guest Usage) لمنظومة دهب دكتور
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

-- دالة الزيادة الذرية (Atomic Upsert & Increment)
CREATE OR REPLACE FUNCTION increment_guest_usage(p_key TEXT, p_day TEXT)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة التراجع الذري عند فشل الذكاء الاصطناعي (Atomic Decrement / Rollback)
CREATE OR REPLACE FUNCTION decrement_guest_usage(p_key TEXT, p_day TEXT)
RETURNS INTEGER AS $$
DECLARE
  new_used INTEGER;
BEGIN
  UPDATE guest_usage
  SET used = GREATEST(0, used - 1), updated_at = NOW()
  WHERE key = p_key AND day = p_day
  RETURNING used INTO new_used;
  RETURN COALESCE(new_used, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
