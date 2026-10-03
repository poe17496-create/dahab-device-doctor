-- =====================================================
-- تحديث نظام تتبع الاستخدام لاستخدام Device Fingerprint
-- =====================================================

-- إضافة عمود جديد للـ device fingerprint
ALTER TABLE usage_tracking ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- إنشاء index للعمود الجديد
CREATE INDEX IF NOT EXISTS idx_usage_tracking_device_fingerprint ON usage_tracking(device_fingerprint);

-- تحديث الدالة لدعم الـ device fingerprint
CREATE OR REPLACE FUNCTION check_and_increment_usage(p_ip_address TEXT)
RETURNS JSON AS $$
DECLARE
  usage_record usage_tracking%ROWTYPE;
  max_daily_limit INTEGER := 5;
  is_allowed BOOLEAN := true;
  message TEXT := '';
  current_count INTEGER := 0;
BEGIN
  -- البحث عن سجل هذا المعرف (الآن هو combined ID)
  SELECT * INTO usage_record
  FROM usage_tracking
  WHERE ip_address = p_ip_address OR device_fingerprint = p_ip_address
  FOR UPDATE;

  -- إذا لم يوجد سجل، أنشئ سجلاً جديداً
  IF NOT FOUND THEN
    INSERT INTO usage_tracking (ip_address, device_fingerprint, request_count, last_request_date)
    VALUES (p_ip_address, p_ip_address, 1, CURRENT_DATE);
    current_count := 1;
    message := 'تم تسجيل طلبك الأول';
  ELSE
    -- التحقق من أن آخر طلب كان اليوم
    IF usage_record.last_request_date = CURRENT_DATE THEN
      -- نفس اليوم: زيادة العداد
      IF usage_record.request_count >= max_daily_limit THEN
        -- تم تجاوز الحد
        is_allowed := false;
        current_count := usage_record.request_count;
        message := 'لقد استنفدت 5 محاولات مجانية اليوم. عد غداً للمزيد.';
      ELSE
        -- زيادة العداد
        UPDATE usage_tracking
        SET request_count = request_count + 1,
            updated_at = NOW()
        WHERE ip_address = p_ip_address OR device_fingerprint = p_ip_address;
        current_count := usage_record.request_count + 1;
        message := 'تم تسجيل طلبك بنجاح';
      END IF;
    ELSE
      -- يوم جديد: إعادة تعيين العداد
      UPDATE usage_tracking
      SET request_count = 1,
          last_request_date = CURRENT_DATE,
          updated_at = NOW()
      WHERE ip_address = p_ip_address OR device_fingerprint = p_ip_address;
      current_count := 1;
      message := 'يوم جديد! تم إعادة تعيين العداد';
    END IF;
  END IF;

  -- إرجاع النتيجة
  RETURN json_build_object(
    'allowed', is_allowed,
    'current_count', current_count,
    'max_allowed', max_daily_limit,
    'message', message
  );
END;
$$ LANGUAGE plpgsql;

-- تحديث دالة get_remaining_requests
CREATE OR REPLACE FUNCTION get_remaining_requests(p_ip_address TEXT)
RETURNS INTEGER AS $$
DECLARE
  remaining INTEGER;
  max_daily_limit INTEGER := 5;
BEGIN
  SELECT COALESCE(max_daily_limit - request_count, max_daily_limit)
  INTO remaining
  FROM usage_tracking
  WHERE (ip_address = p_ip_address OR device_fingerprint = p_ip_address)
  AND last_request_date = CURRENT_DATE;

  IF remaining IS NULL THEN
    RETURN max_daily_limit;
  END IF;

  RETURN GREATEST(0, remaining);
END;
$$ LANGUAGE plpgsql;

-- تحديث دالة reset_usage_tracking
CREATE OR REPLACE FUNCTION reset_usage_tracking(p_ip_address TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  reset_count INTEGER;
BEGIN
  IF p_ip_address IS NULL THEN
    -- إعادة تعيين جميع السجلات
    UPDATE usage_tracking
    SET request_count = 0,
        last_request_date = CURRENT_DATE - INTERVAL '1 day';
    GET DIAGNOSTICS reset_count = ROW_COUNT;
  ELSE
    -- إعادة تعيين IP محدد
    UPDATE usage_tracking
    SET request_count = 0,
        last_request_date = CURRENT_DATE - INTERVAL '1 day'
    WHERE ip_address = p_ip_address OR device_fingerprint = p_ip_address;
    GET DIAGNOSTICS reset_count = ROW_COUNT;
  END IF;

  RETURN reset_count;
END;
$$ LANGUAGE plpgsql;

-- إضافة comments جديدة
COMMENT ON COLUMN usage_tracking.device_fingerprint IS 'Device fingerprint hash (IP + User Agent + Cookie)';
COMMENT ON FUNCTION check_and_increment_usage IS 'دالة للتحقق من الاستخدام وزيادة العداد (تدعم device fingerprint)';
