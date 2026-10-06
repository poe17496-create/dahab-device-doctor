import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

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
 * التحقق من تجارب الزائر وزيادة العداد
 * @returns { success: boolean, remaining: number, error?: string }
 */
export async function checkAndIncrementGuestTrials(request: Request): Promise<{
  success: boolean;
  remaining: number;
  error?: string;
}> {
  // إذا لم يكن Supabase مهيأً، نسمح بالاستخدام (fallback)
  if (!isSupabaseConfigured || !supabaseAdmin) {
    console.warn('[GuestTrials] Supabase not configured, allowing usage');
    return { success: true, remaining: MAX_GUEST_DAILY_TRIALS };
  }

  const ip = getClientIP(request);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // 1. محاولة الحصول على السجل الحالي
    const { data: existingRecord, error: fetchError } = await supabaseAdmin
      .from('guest_trials')
      .select('*')
      .eq('ip', ip)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 يعني "not found" وهو متوقع إذا لم يكن IP موجوداً
      console.error('[GuestTrials] Error fetching record:', fetchError);
      // في حالة الخطأ، نسمح بالاستخدام كـ fallback
      return { success: true, remaining: MAX_GUEST_DAILY_TRIALS };
    }

    if (!existingRecord) {
      // 2. IP غير موجود - إنشاء سجل جديد
      const { error: insertError } = await supabaseAdmin
        .from('guest_trials')
        .insert({
          ip,
          count: 1,
          last_date: today,
        });

      if (insertError) {
        console.error('[GuestTrials] Error inserting record:', insertError);
        return { success: true, remaining: MAX_GUEST_DAILY_TRIALS };
      }

      console.log(`[GuestTrials] New IP ${ip} - Count: 1/5`);
      return { success: true, remaining: MAX_GUEST_DAILY_TRIALS - 1 };
    }

    // 3. IP موجود - التحقق من التاريخ
    if (existingRecord.last_date !== today) {
      // التاريخ من يوم سابق - إعادة تعيين العداد
      const { error: updateError } = await supabaseAdmin
        .from('guest_trials')
        .update({
          count: 1,
          last_date: today,
        })
        .eq('ip', ip);

      if (updateError) {
        console.error('[GuestTrials] Error resetting count:', updateError);
        return { success: true, remaining: MAX_GUEST_DAILY_TRIALS };
      }

      console.log(`[GuestTrials] Reset for IP ${ip} - Count: 1/5`);
      return { success: true, remaining: MAX_GUEST_DAILY_TRIALS - 1 };
    }

    // 4. نفس اليوم - التحقق من العداد
    if (existingRecord.count >= MAX_GUEST_DAILY_TRIALS) {
      // تجاوز الحد المسموح
      console.log(`[GuestTrials] IP ${ip} exceeded limit: ${existingRecord.count}/5`);
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
      .update({ count: newCount })
      .eq('ip', ip);

    if (incrementError) {
      console.error('[GuestTrials] Error incrementing count:', incrementError);
      return { success: true, remaining: MAX_GUEST_DAILY_TRIALS - existingRecord.count };
    }

    console.log(`[GuestTrials] IP ${ip} - Count: ${newCount}/5`);
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
export async function getGuestRemainingTrialsFromSupabase(request: Request): Promise<number> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return MAX_GUEST_DAILY_TRIALS;
  }

  const ip = getClientIP(request);
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data: record } = await supabaseAdmin
      .from('guest_trials')
      .select('count, last_date')
      .eq('ip', ip)
      .single();

    if (!record || record.last_date !== today) {
      return MAX_GUEST_DAILY_TRIALS;
    }

    return Math.max(0, MAX_GUEST_DAILY_TRIALS - record.count);
  } catch (error) {
    console.error('[GuestTrials] Error getting remaining trials:', error);
    return MAX_GUEST_DAILY_TRIALS;
  }
}
