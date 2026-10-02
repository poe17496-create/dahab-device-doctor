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
      .or(`part_number.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error('Error searching IC database:', error);
      return NextResponse.json({ error: 'فشل في البحث عن بدائل الآيسي' }, { status: 500 });
    }

    // تحويل البيانات من Supabase إلى الشكل المتوقع
    const results = (icData || []).map((ic: any) => ({
      partNumber: ic.part_number,
      category: ic.category,
      deviceFamily: ic.specifications?.deviceFamily || 'غير محدد',
      function: ic.description,
      compatibles: ic.alternates || [],
      commonSymptoms: ic.pinout?.commonSymptoms || 'غير محدد',
      diodeReadings: ic.pinout?.diodeReadings || 'غير محدد',
      donorBoards: [],
      datasheetUrl: ic.datasheet_url,
      pinout: ic.pinout,
    }));

    return NextResponse.json({ results, source: 'supabase' });
  } catch (error) {
    console.error('IC Lookup API error:', error);
    return NextResponse.json({ error: 'فشل في البحث عن بدائل الآيسي' }, { status: 500 });
  }
}
