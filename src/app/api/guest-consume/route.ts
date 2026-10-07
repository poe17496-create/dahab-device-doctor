import { NextRequest, NextResponse } from 'next/server';
import { checkAndIncrementGuestTrials } from '@/lib/guestTrialsSupabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log('[GuestConsume API] Request received');
    const result = await checkAndIncrementGuestTrials(req);
    console.log('[GuestConsume API] Result:', result);

    const response = NextResponse.json({
      success: result.success,
      remaining: result.remaining,
      error: result.error
    });

    // إرسال Cookie إذا تم إنشاء جلسة جديدة
    if (result.setCookie) {
      response.headers.set('Set-Cookie', result.setCookie);
    }

    return response;
  } catch (error) {
    console.error('[GuestConsume] Error:', error);
    return NextResponse.json({ success: true, remaining: 5 });
  }
}
