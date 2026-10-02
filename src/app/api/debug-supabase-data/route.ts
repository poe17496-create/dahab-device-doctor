import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' });
    }

    // فحص ic_database
    const { data: icData, error: icError } = await supabaseAdmin
      .from('ic_database')
      .select('*')
      .limit(5);

    // فحص verified_faults
    const { data: faultsData, error: faultsError } = await supabaseAdmin
      .from('verified_faults')
      .select('*')
      .limit(5);

    return NextResponse.json({
      ic_database: {
        count: icData?.length || 0,
        error: icError?.message,
        sample: icData,
      },
      verified_faults: {
        count: faultsData?.length || 0,
        error: faultsError?.message,
        sample: faultsData,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
