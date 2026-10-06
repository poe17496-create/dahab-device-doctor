import { NextRequest, NextResponse } from 'next/server';
import { checkAndIncrementGuestTrials } from '@/lib/guestTrialsSupabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log('[GuestConsume API] Request received');
    const result = await checkAndIncrementGuestTrials(req);
    console.log('[GuestConsume API] Result:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[GuestConsume] Error:', error);
    return NextResponse.json({ success: true, remaining: 5 });
  }
}
