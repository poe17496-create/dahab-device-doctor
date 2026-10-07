import { NextRequest, NextResponse } from 'next/server';
import { getGuestRemaining, setGuestCookie } from '@/lib/guestUsageServer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { remaining, guestId, isNewCookie } = await getGuestRemaining(req);
    
    const response = NextResponse.json({ remaining, success: true });
    
    // حفظ كوكي guestId إذا كان زائراً جديداً
    if (isNewCookie) {
      setGuestCookie(response.headers, guestId);
    }

    return response;
  } catch (error) {
    console.error('[API /api/guest/remaining] Error:', error);
    return NextResponse.json({ remaining: 0, success: false }, { status: 500 });
  }
}
