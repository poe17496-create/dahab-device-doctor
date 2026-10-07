/**
 * إدارة رصيد الزائر اليومي - الواجهة الأمامية (Client-Side)
 * تم إلغاء الاعتماد على localStorage تماماً ونقل كافة الحسابات والخصم الذري للسيرفر
 */

export const MAX_GUEST_DAILY_TRIALS = 5;

/**
 * فحص ما إذا كان المستخدم الحالي زائراً غير مسجل
 */
export function isCurrentGuest(): boolean {
  if (typeof window === 'undefined') return false;
  const userStr = localStorage.getItem('dahab_current_user');
  if (!userStr) return true; // غير مسجل يعتبر زائر
  try {
    const user = JSON.parse(userStr);
    const isRegistered = Boolean(user.username && user.role && user.role !== 'guest' && !user.isGuest);
    return !isRegistered;
  } catch {
    return true;
  }
}

/**
 * جلب الرصيد الحقيقي المتبقي للزائر من السيرفر مباشرة
 */
export async function getGuestRemainingTrials(): Promise<number> {
  if (typeof window === 'undefined') return MAX_GUEST_DAILY_TRIALS;

  if (!isCurrentGuest()) {
    return 999; // الفني المسجل غير محدود
  }

  try {
    const res = await fetch('/api/guest/remaining', {
      method: 'GET',
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return typeof data.remaining === 'number' ? data.remaining : 0;
    }
  } catch (err) {
    console.error('[guestUsage] Failed to fetch remaining trials from server:', err);
  }

  return 0;
}

/**
 * دالة مساعدة لتحديث رصيد الزائر في الواجهة بعد تلقي رد السيرفر
 */
export function dispatchGuestRemainingUpdate(remaining: number): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('dahab_guest_trial_consumed', { detail: { remaining } })
    );
  }
}
