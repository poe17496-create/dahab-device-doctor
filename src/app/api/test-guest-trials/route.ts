import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('[TestGuestTrials] Starting test...');

    // Check Supabase config
    console.log('[TestGuestTrials] isSupabaseConfigured:', isSupabaseConfigured);
    console.log('[TestGuestTrials] supabaseAdmin:', !!supabaseAdmin);

    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        isSupabaseConfigured,
        hasSupabaseAdmin: !!supabaseAdmin
      });
    }

    // Test connection to guest_trials table
    const { data, error } = await supabaseAdmin
      .from('guest_trials')
      .select('*')
      .limit(1);

    console.log('[TestGuestTrials] Query result:', { data, error });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      tableExists: true,
      sampleData: data
    });
  } catch (error: any) {
    console.error('[TestGuestTrials] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
