import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({ results: [] });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const { data: icData, error } = await supabaseAdmin
      .from('ic_database')
      .select('*')
      .or(`ic_number.ilike.%${query}%,ic_name.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error('Error searching IC database:', error);
      return NextResponse.json({ error: 'فشل في البحث عن بدائل الآيسي' }, { status: 500 });
    }

    // تحويل البيانات من Supabase إلى الشكل المتوقع
    const results = (icData || []).map((ic: any) => ({
      partNumber: ic.ic_number,
      category: ic.category,
      deviceFamily: ic.ic_name,
      function: ic.ic_name,
      compatibles: ic.compatibilities || [],
      commonSymptoms: 'انظر datasheet',
      diodeReadings: 'انظر datasheet',
      donorBoards: [],
      datasheetUrl: ic.datasheet_url,
      pinout: ic.pinout_data,
    }));

    return NextResponse.json({ results, source: 'supabase' });
  } catch (error) {
    console.error('IC Lookup API error:', error);
    return NextResponse.json({ error: 'فشل في البحث عن بدائل الآيسي' }, { status: 500 });
  }
}
