import { NextRequest, NextResponse } from 'next/server';
import { getGuestRemainingTrialsFromSupabase } from '@/lib/guestTrialsSupabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('[GuestRemaining API] Request received');
    const remaining = await getGuestRemainingTrialsFromSupabase(req);
    console.log('[GuestRemaining API] Returning:', remaining);
    return NextResponse.json({ success: true, remaining });
  } catch (error) {
    console.error('[GuestRemaining] Error:', error);
    return NextResponse.json({ success: false, remaining: 5 });
  }
}
