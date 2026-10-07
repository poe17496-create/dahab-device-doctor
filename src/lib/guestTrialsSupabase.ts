import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import crypto from 'crypto';

const MAX_GUEST_DAILY_TRIALS = 5;

/**
 * استخراج عنوان IP الحقيقي من الطلب
 */
export function getClientIP(request: Request): string {
  // محاولة الحصول على IP من مختلف الـ headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    // x-forwarded-for قد يحتوي على عدة IPs مفصولة بفاصلة
    // نأخذ الأول لأنه IP الأصلي
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // في حالة عدم وجود أي header، نستخدم IP افتراضي
  return 'unknown';
}

/**
 * استخراج أو إنشاء Session ID من Cookie
 */
export function getOrCreateSessionId(request: Request): string {
  const cookieHeader = request.headers.get('cookie') || '';

  // محاولة استخراج الـ session cookie الموجود
  const sessionMatch = cookieHeader.match(/dahab_guest_session=([^;]+)/);
  if (sessionMatch && sessionMatch[1]) {
    return sessionMatch[1];
  }

  // إذا لم يوجد، سيتم إنشاء واحد جديد (يتم إرساله في الاستجابة)
  return null;
}

/**
 * إنشاء Session ID جديد فريد
 */
export function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * استخراج معلومات Fingerprint من الطلب
 */
export function getFingerprintData(request: Request): {
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
} {
  return {
    userAgent: request.headers.get('user-agent') || 'unknown',
    acceptLanguage: request.headers.get('accept-language') || 'unknown',
    acceptEncoding: request.headers.get('accept-encoding') || 'unknown',
  };
}

/**
 * إنشاء معرف فريد للزائر يجمع بين IP و Session ID و Fingerprint
 */
export function generateGuestIdentifier(request: Request, clientFingerprint?: {
  screenResolution?: string;
  timezone?: string;
  platform?: string;
}): {
  ip: string;
  sessionId: string;
  combinedId: string;
  fingerprint: string;
} {
  const ip = getClientIP(request);
  const sessionId = getOrCreateSessionId(request) || generateSessionId();
  const serverFingerprint = getFingerprintData(request);

  // دمج كل المعلومات لإنشاء معرف فريد قوي
  const fingerprintString = JSON.stringify({
    ip,
    sessionId,
    serverFingerprint,
    clientFingerprint: clientFingerprint || {},
  });

  const combinedId = crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex');

  // إنشاء fingerprint مبسط (بدالة) للعرض والتخزين
  const simpleFingerprint = crypto
    .createHash('sha256')
    .update(`${ip}:${serverFingerprint.userAgent}:${serverFingerprint.acceptLanguage}`)
    .digest('hex');

  return { ip, sessionId, combinedId, fingerprint: simpleFingerprint };
}

/**
 * التحقق من تجارب الزائر وزيادة العداد
 * @returns { success: boolean, remaining: number, error?: string, setCookie?: string }
 */
export async function checkAndIncrementGuestTrials(
  request: Request,
  clientFingerprint?: {
    screenResolution?: string;
    timezone?: string;
    platform?: string;
  }
): Promise<{
  success: boolean;
  remaining: number;
  error?: string;
  setCookie?: string;
}> {
  // إذا لم يكن Supabase مهيأً، نسمح بالاستخدام (fallback)
  if (!isSupabaseConfigured || !supabaseAdmin) {
    console.warn('[GuestTrials] Supabase not configured, allowing usage');
    return { success: true, remaining: MAX_GUEST_DAILY_TRIALS };
  }

  const { ip, sessionId, combinedId, fingerprint } = generateGuestIdentifier(request, clientFingerprint);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  console.log(`[GuestTrials] Checking - IP: ${ip}, Session: ${sessionId}, Fingerprint: ${fingerprint.substring(0, 8)}..., Today: ${today}`);

  let setCookieHeader: string | undefined;

  try {
    // 1. محاولة الحصول على السجل الحالي باستخدام Fingerprint (أكثر استقراراً)
    const { data: existingRecord, error: fetchError } = await supabaseAdmin
      .from('guest_trials')
      .select('*')
      .eq('fingerprint', fingerprint)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 يعني "not found" وهو متوقع إذا لم يكن المعرف موجوداً
      console.error('[GuestTrials] Error fetching record:', fetchError);
      // في حالة الخطأ، نسمح بالاستخدام كـ fallback
      return { success: true, remaining: MAX_GUEST_DAILY_TRIALS };
    }

    if (!existingRecord) {
      // 2. معرف غير موجود - إنشاء سجل جديد
      const { error: insertError } = await supabaseAdmin
        .from('guest_trials')
        .insert({
          identifier: combinedId,
          fingerprint: fingerprint,
          ip,
          session_id: sessionId,
          count: 1,
          last_date: today,
        } as any);

      if (insertError) {
        console.error('[GuestTrials] Error inserting record:', insertError);
        return { success: true, remaining: MAX_GUEST_DAILY_TRIALS };
      }

      // تعيين Cookie للجلسة الجديدة
      setCookieHeader = `dahab_guest_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`;

      console.log(`[GuestTrials] New guest - IP: ${ip}, Fingerprint: ${fingerprint.substring(0, 8)}..., Count: 1/5`);
      return {
        success: true,
        remaining: MAX_GUEST_DAILY_TRIALS - 1,
        setCookie: setCookieHeader
      };
    }

    // 3. معرف موجود - التحقق من التاريخ
    if (existingRecord.last_date !== today) {
      // التاريخ من يوم سابق - إعادة تعيين العداد
      const { error: updateError } = await supabaseAdmin
        .from('guest_trials')
        .update({
          count: 1,
          last_date: today,
          identifier: combinedId, // تحديث identifier في حال تغير Session ID
          session_id: sessionId,
        } as any)
        .eq('fingerprint', fingerprint);

      if (updateError) {
        console.error('[GuestTrials] Error resetting count:', updateError);
        return { success: true, remaining: MAX_GUEST_DAILY_TRIALS };
      }

      console.log(`[GuestTrials] Reset for guest - Fingerprint: ${fingerprint.substring(0, 8)}..., Count: 1/5`);
      return { success: true, remaining: MAX_GUEST_DAILY_TRIALS - 1 };
    }

    // 4. نفس اليوم - التحقق من العداد
    if (existingRecord.count >= MAX_GUEST_DAILY_TRIALS) {
      // تجاوز الحد المسموح
      console.log(`[GuestTrials] Guest exceeded limit - Fingerprint: ${fingerprint.substring(0, 8)}..., Count: ${existingRecord.count}/5`);
      return {
        success: false,
        remaining: 0,
        error: 'لقد استنفدت محاولاتك المجانية اليومية (5/5). يرجى تسجيل الدخول للحصول على وصول كامل.'
      };
    }

    // زيادة العداد
    const newCount = existingRecord.count + 1;
    const { error: incrementError } = await supabaseAdmin
      .from('guest_trials')
      .update({
        count: newCount,
        identifier: combinedId, // تحديث identifier في حال تغير Session ID
        session_id: sessionId,
      } as any)
      .eq('fingerprint', fingerprint);

    if (incrementError) {
      console.error('[GuestTrials] Error incrementing count:', incrementError);
      return { success: true, remaining: MAX_GUEST_DAILY_TRIALS - existingRecord.count };
    }

    console.log(`[GuestTrials] Guest - Fingerprint: ${fingerprint.substring(0, 8)}..., Count: ${newCount}/5`);
    return { success: true, remaining: MAX_GUEST_DAILY_TRIALS - newCount };

  } catch (error) {
    console.error('[GuestTrials] Unexpected error:', error);
    // في حالة أي خطأ، نسمح بالاستخدام كـ fallback
    return { success: true, remaining: MAX_GUEST_DAILY_TRIALS };
  }
}

/**
 * الحصول على عدد المحاولات المتبقية للزائر (للعرض فقط)
 */
export async function getGuestRemainingTrialsFromSupabase(
  request: Request,
  clientFingerprint?: {
    screenResolution?: string;
    timezone?: string;
    platform?: string;
  }
): Promise<number> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    console.warn('[GuestTrials] Supabase not configured in getGuestRemainingTrials');
    return MAX_GUEST_DAILY_TRIALS;
  }

  const { ip, sessionId, combinedId, fingerprint } = generateGuestIdentifier(request, clientFingerprint);
  const today = new Date().toISOString().split('T')[0];

  console.log(`[GuestTrials] Getting remaining - IP: ${ip}, Fingerprint: ${fingerprint.substring(0, 8)}..., Today: ${today}`);

  try {
    const { data: record } = await supabaseAdmin
      .from('guest_trials')
      .select('count, last_date')
      .eq('fingerprint', fingerprint)
      .single();

    console.log(`[GuestTrials] Record found:`, record);

    if (!record || record.last_date !== today) {
      console.log(`[GuestTrials] No record or old date, returning MAX: ${MAX_GUEST_DAILY_TRIALS}`);
      return MAX_GUEST_DAILY_TRIALS;
    }

    const remaining = Math.max(0, MAX_GUEST_DAILY_TRIALS - record.count);
    console.log(`[GuestTrials] Returning remaining: ${remaining}`);
    return remaining;
  } catch (error) {
    console.error('[GuestTrials] Error getting remaining trials:', error);
    return MAX_GUEST_DAILY_TRIALS;
  }
}
