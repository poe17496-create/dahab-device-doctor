// إدارة وتوحيد رصيد الزائر اليومي المشترك عبر كافة أدوات المنظومة
export const MAX_GUEST_DAILY_TRIALS = 5;

export function getTodayKey(): string {
  const today = new Date().toISOString().split('T')[0];
  return `dahab_guest_usage_${today}`;
}

export function isCurrentGuest(): boolean {
  if (typeof window === 'undefined') return false;
  const userStr = localStorage.getItem('dahab_current_user');
  if (!userStr) return true; // غير مسجل يعتبر زائر
  try {
    const user = JSON.parse(userStr);
    // المستخدم مسجل إذا كان لديه username و role وليس guest
    const isRegistered = user.username && user.role && user.role !== 'guest' && !user.isGuest;
    return !isRegistered;
  } catch {
    return true;
  }
}

export async function getGuestRemainingTrials(): Promise<number> {
  if (typeof window === 'undefined') return MAX_GUEST_DAILY_TRIALS;
  try {
    // الحصول على المحاولات المتبقية من Supabase عبر API
    const response = await fetch('/api/guest-remaining');
    const data = await response.json();
    if (data.success) {
      return data.remaining;
    }
    // Fallback إلى localStorage في حالة فشل API
    const key = getTodayKey();
    const used = parseInt(localStorage.getItem(key) || '0', 10);
    return Math.max(0, MAX_GUEST_DAILY_TRIALS - used);
  } catch (e) {
    console.error('[GuestUsage] Error fetching remaining trials:', e);
    // Fallback: إذا فشل API، نستخدم localStorage
    const key = getTodayKey();
    const used = parseInt(localStorage.getItem(key) || '0', 10);
    return Math.max(0, MAX_GUEST_DAILY_TRIALS - used);
  }
}

export async function consumeGuestTrial(featureName: string = 'general'): Promise<{ success: boolean; remaining: number }> {
  if (typeof window === 'undefined') return { success: true, remaining: MAX_GUEST_DAILY_TRIALS };

  try {
    if (!isCurrentGuest()) {
      // المستخدم فني معتمد مسجل، استخدام غير محدود
      return { success: true, remaining: 999 };
    }

    // خصم المحاولة من Supabase عبر API
    try {
      const response = await fetch('/api/guest-consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (!data.success) {
        return { success: false, remaining: data.remaining || 0 };
      }

      const remaining = data.remaining;

      // تحديث كائن المستخدم في الذاكرة
      const userStr = localStorage.getItem('dahab_current_user');
      let guestId = 'unknown';
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          user.name = `زائر (${remaining} تجربة متبقية اليوم)`;
          localStorage.setItem('dahab_current_user', JSON.stringify(user));
          guestId = user.id || 'unknown';
        } catch {}
      }

      // إشعار السيرفر إحصائياً (مع guestId من currentUser) - غير متزامن بالكامل
      setTimeout(() => {
        fetch('/api/guests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestId, action: featureName, remaining }),
        }).catch(() => {});
      }, 0);

      // إطلاق حدث محلي لتحديث الواجهات
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dahab_guest_trial_consumed', { detail: { remaining, featureName } }));
      }

      return { success: true, remaining };
    } catch (error) {
      console.error('[GuestUsage] Error consuming trial from API:', error);
      // Fallback إلى localStorage في حالة فشل API
      const key = getTodayKey();
      const used = parseInt(localStorage.getItem(key) || '0', 10);

      if (used >= MAX_GUEST_DAILY_TRIALS) {
        return { success: false, remaining: 0 };
      }

      const newUsed = used + 1;
      try {
        localStorage.setItem(key, String(newUsed));
      } catch (e) {
        console.error('[GuestUsage] Error writing to localStorage:', e);
        return { success: true, remaining: Math.max(0, MAX_GUEST_DAILY_TRIALS - used) };
      }
      const remaining = Math.max(0, MAX_GUEST_DAILY_TRIALS - newUsed);

      return { success: true, remaining };
    }
  } catch (e) {
    console.error('[GuestUsage] Unexpected error in consumeGuestTrial:', e);
    // Fallback: في حالة أي خطأ، نسمح بالاستخدام
    return { success: true, remaining: MAX_GUEST_DAILY_TRIALS };
  }
}
