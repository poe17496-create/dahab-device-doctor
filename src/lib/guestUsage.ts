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
    return !!user.isGuest || user.role === 'guest';
  } catch {
    return true;
  }
}

export function getGuestRemainingTrials(): number {
  if (typeof window === 'undefined') return MAX_GUEST_DAILY_TRIALS;
  const key = getTodayKey();
  const used = parseInt(localStorage.getItem(key) || '0', 10);
  return Math.max(0, MAX_GUEST_DAILY_TRIALS - used);
}

export function consumeGuestTrial(featureName: string = 'general'): { success: boolean; remaining: number } {
  if (typeof window === 'undefined') return { success: true, remaining: MAX_GUEST_DAILY_TRIALS };

  if (!isCurrentGuest()) {
    // المستخدم فني معتمد مسجل، استخدام غير محدود
    return { success: true, remaining: 999 };
  }

  const key = getTodayKey();
  const used = parseInt(localStorage.getItem(key) || '0', 10);

  if (used >= MAX_GUEST_DAILY_TRIALS) {
    return { success: false, remaining: 0 };
  }

  const newUsed = used + 1;
  localStorage.setItem(key, String(newUsed));
  const remaining = Math.max(0, MAX_GUEST_DAILY_TRIALS - newUsed);

  // تحديث كائن المستخدم في الذاكرة
  const userStr = localStorage.getItem('dahab_current_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      user.name = `زائر (${remaining} تجربة متبقية اليوم)`;
      localStorage.setItem('dahab_current_user', JSON.stringify(user));
    } catch {}
  }

  // إشعار السيرفر إحصائياً
  fetch('/api/guests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: featureName, remaining }),
  }).catch(() => {});

  // إطلاق حدث محلي لتحديث الواجهات
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dahab_guest_trial_consumed', { detail: { remaining, featureName } }));
  }

  return { success: true, remaining };
}
