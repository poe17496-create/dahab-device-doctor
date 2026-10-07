/**
 * تجميع Fingerprint من المتصفح لتحديد هوية المستخدم
 * هذا يعمل حتى في وضع Incognito لأنه يعتمد على خصائص المتصفح الثابتة
 */

export interface ClientFingerprint {
  screenResolution: string;
  timezone: string;
  platform: string;
  language: string;
  colorDepth: number;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

/**
 * تجميع Fingerprint من المتصفح
 */
export function collectClientFingerprint(): ClientFingerprint {
  const fingerprint: ClientFingerprint = {
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    platform: navigator.platform,
    language: navigator.language,
    colorDepth: window.screen.colorDepth,
  };

  // إضافة معلومات إضافية إذا كانت متوفرة
  if ('deviceMemory' in navigator) {
    fingerprint.deviceMemory = (navigator as any).deviceMemory;
  }

  if ('hardwareConcurrency' in navigator) {
    fingerprint.hardwareConcurrency = (navigator as any).hardwareConcurrency;
  }

  return fingerprint;
}

/**
 * إرسال Fingerprint مع طلب consumeGuestTrial
 */
export async function consumeGuestTrialWithFingerprint(
  featureName: string = 'general'
): Promise<{ success: boolean; remaining: number }> {
  if (typeof window === 'undefined') {
    return { success: true, remaining: 5 };
  }

  try {
    const fingerprint = collectClientFingerprint();

    const response = await fetch('/api/guest-consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprint }),
    });

    const data = await response.json();

    if (!data.success) {
      return { success: false, remaining: data.remaining || 0 };
    }

    return { success: true, remaining: data.remaining };
  } catch (error) {
    console.error('[GuestUsage] Error consuming trial with fingerprint:', error);
    // Fallback
    return { success: true, remaining: 5 };
  }
}
