-- =====================================================
-- نظام مراقبة استخدام المفاتيح يومياً
-- =====================================================

-- إنشاء جدول تتبع استخدام المفاتيح
CREATE TABLE IF NOT EXISTS keys_usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openrouter', 'openai', 'deepseek', 'groq')),
  key_id TEXT NOT NULL, -- معرف المفتاح (أول 8 أحرف من المفتاح للتشفير)
  request_count INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  tracking_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء indexes للبحث السريع
CREATE INDEX IF NOT EXISTS idx_keys_usage_provider ON keys_usage_tracking(provider);
CREATE INDEX IF NOT EXISTS idx_keys_usage_key_id ON keys_usage_tracking(key_id);
CREATE INDEX IF NOT EXISTS idx_keys_usage_date ON keys_usage_tracking(tracking_date DESC);

-- =====================================================
-- دالة لتسجيل استخدام المفتاح
-- =====================================================
CREATE OR REPLACE FUNCTION log_key_usage(p_provider TEXT, p_key_id TEXT, p_tokens_used INTEGER DEFAULT 0, p_success BOOLEAN DEFAULT true)
RETURNS VOID AS $$
BEGIN
  INSERT INTO keys_usage_tracking (provider, key_id, request_count, total_tokens_used, success_count, error_count, last_used_at, tracking_date)
  VALUES (p_provider, p_key_id, 1, p_tokens_used, CASE WHEN p_success THEN 1 ELSE 0 END, CASE WHEN NOT p_success THEN 1 ELSE 0 END, NOW(), CURRENT_DATE)
  ON CONFLICT (provider, key_id, tracking_date) DO UPDATE SET
    request_count = keys_usage_tracking.request_count + 1,
    total_tokens_used = keys_usage_tracking.total_tokens_used + p_tokens_used,
    success_count = keys_usage_tracking.success_count + CASE WHEN p_success THEN 1 ELSE 0 END,
    error_count = keys_usage_tracking.error_count + CASE WHEN NOT p_success THEN 1 ELSE 0 END,
    last_used_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- دالة للحصول على إحصائيات المفاتيح اليومية
-- =====================================================
CREATE OR REPLACE FUNCTION get_keys_daily_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'date', p_date,
    'gemini', (
      SELECT json_build_object(
        'total_requests', COALESCE(SUM(request_count), 0),
        'total_tokens', COALESCE(SUM(total_tokens_used), 0),
        'success_count', COALESCE(SUM(success_count), 0),
        'error_count', COALESCE(SUM(error_count), 0),
        'active_keys', COUNT(DISTINCT key_id)
      ) FROM keys_usage_tracking WHERE provider = 'gemini' AND tracking_date = p_date
    ),
    'openrouter', (
      SELECT json_build_object(
        'total_requests', COALESCE(SUM(request_count), 0),
        'total_tokens', COALESCE(SUM(total_tokens_used), 0),
        'success_count', COALESCE(SUM(success_count), 0),
        'error_count', COALESCE(SUM(error_count), 0),
        'active_keys', COUNT(DISTINCT key_id)
      ) FROM keys_usage_tracking WHERE provider = 'openrouter' AND tracking_date = p_date
    ),
    'openai', (
      SELECT json_build_object(
        'total_requests', COALESCE(SUM(request_count), 0),
        'total_tokens', COALESCE(SUM(total_tokens_used), 0),
        'success_count', COALESCE(SUM(success_count), 0),
        'error_count', COALESCE(SUM(error_count), 0),
        'active_keys', COUNT(DISTINCT key_id)
      ) FROM keys_usage_tracking WHERE provider = 'openai' AND tracking_date = p_date
    ),
    'deepseek', (
      SELECT json_build_object(
        'total_requests', COALESCE(SUM(request_count), 0),
        'total_tokens', COALESCE(SUM(total_tokens_used), 0),
        'success_count', COALESCE(SUM(success_count), 0),
        'error_count', COALESCE(SUM(error_count), 0),
        'active_keys', COUNT(DISTINCT key_id)
      ) FROM keys_usage_tracking WHERE provider = 'deepseek' AND tracking_date = p_date
    )
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- دالة للحصول على إحصائيات المفاتيح الإجمالية
-- =====================================================
CREATE OR REPLACE FUNCTION get_keys_total_stats()
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'gemini', (
      SELECT json_build_object(
        'total_requests', COALESCE(SUM(request_count), 0),
        'total_tokens', COALESCE(SUM(total_tokens_used), 0),
        'success_count', COALESCE(SUM(success_count), 0),
        'error_count', COALESCE(SUM(error_count), 0),
        'days_active', COUNT(DISTINCT tracking_date),
        'active_keys', COUNT(DISTINCT key_id)
      ) FROM keys_usage_tracking WHERE provider = 'gemini'
    ),
    'openrouter', (
      SELECT json_build_object(
        'total_requests', COALESCE(SUM(request_count), 0),
        'total_tokens', COALESCE(SUM(total_tokens_used), 0),
        'success_count', COALESCE(SUM(success_count), 0),
        'error_count', COALESCE(SUM(error_count), 0),
        'days_active', COUNT(DISTINCT tracking_date),
        'active_keys', COUNT(DISTINCT key_id)
      ) FROM keys_usage_tracking WHERE provider = 'openrouter'
    ),
    'openai', (
      SELECT json_build_object(
        'total_requests', COALESCE(SUM(request_count), 0),
        'total_tokens', COALESCE(SUM(total_tokens_used), 0),
        'success_count', COALESCE(SUM(success_count), 0),
        'error_count', COALESCE(SUM(error_count), 0),
        'days_active', COUNT(DISTINCT tracking_date),
        'active_keys', COUNT(DISTINCT key_id)
      ) FROM keys_usage_tracking WHERE provider = 'openai'
    ),
    'deepseek', (
      SELECT json_build_object(
        'total_requests', COALESCE(SUM(request_count), 0),
        'total_tokens', COALESCE(SUM(total_tokens_used), 0),
        'success_count', COALESCE(SUM(success_count), 0),
        'error_count', COALESCE(SUM(error_count), 0),
        'days_active', COUNT(DISTINCT tracking_date),
        'active_keys', COUNT(DISTINCT key_id)
      ) FROM keys_usage_tracking WHERE provider = 'deepseek'
    )
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- دالة للحصول على تفاصيل كل مفتاح
-- =====================================================
CREATE OR REPLACE FUNCTION get_keys_details(p_provider TEXT DEFAULT NULL, p_days INTEGER DEFAULT 7)
RETURNS JSON AS $$
DECLARE
  details JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'provider', provider,
      'key_id', key_id,
      'last_used', last_used_at,
      'recent_stats', (
        SELECT json_build_object(
          'requests', SUM(request_count),
          'tokens', SUM(total_tokens_used),
          'success', SUM(success_count),
          'errors', SUM(error_count)
        )
        FROM keys_usage_tracking k2
        WHERE k2.provider = keys_usage_tracking.provider
        AND k2.key_id = keys_usage_tracking.key_id
        AND k2.tracking_date >= CURRENT_DATE - INTERVAL '1 day' * p_days
      )
    )
  ) INTO details
  FROM keys_usage_tracking
  WHERE (p_provider IS NULL OR provider = p_provider)
  AND tracking_date >= CURRENT_DATE - INTERVAL '1 day' * p_days
  GROUP BY provider, key_id, last_used_at
  ORDER BY last_used_at DESC;

  RETURN COALESCE(details, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- إضافة comments
-- =====================================================
COMMENT ON TABLE keys_usage_tracking IS 'جدول تتبع استخدام مفاتيح الذكاء الاصطناعي يومياً';
COMMENT ON FUNCTION log_key_usage IS 'دالة لتسجيل استخدام المفتاح';
COMMENT ON FUNCTION get_keys_daily_stats IS 'دالة للحصول على إحصائيات المفاتيح اليومية';
COMMENT ON FUNCTION get_keys_total_stats IS 'دالة للحصول على إحصائيات المفاتيح الإجمالية';
COMMENT ON FUNCTION get_keys_details IS 'دالة للحصول على تفاصيل كل مفتاح';
