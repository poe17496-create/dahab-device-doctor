import { NextRequest, NextResponse } from 'next/server';
import { searchICDatabase } from '@/lib/icDatabase';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    // البحث في Supabase أولاً إذا كانت مفعلة
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: icData, error } = await supabaseAdmin
          .from('ic_database')
          .select('*')
          .or(`part_number.ilike.%${query}%,manufacturer.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
          .limit(20);

        if (!error && icData && icData.length > 0) {
          // تحويل البيانات من Supabase إلى الشكل المتوقع
          const results = icData.map((ic: any) => ({
            partNumber: ic.part_number,
            category: ic.category,
            deviceFamily: ic.manufacturer,
            function: ic.description,
            compatibles: ic.alternates || [],
            commonSymptoms: 'انظر datasheet',
            diodeReadings: 'انظر datasheet',
            donorBoards: [],
          }));

          return NextResponse.json({ results, source: 'supabase' });
        }
      } catch (sbErr) {
        console.warn('Supabase IC lookup failed, falling back to local:', sbErr);
      }
    }

    // الفallback للبحث المحلي
    const results = searchICDatabase(query);
    return NextResponse.json({ results, source: 'local' });
  } catch (error) {
    console.error('IC Lookup API error:', error);
    return NextResponse.json({ error: 'فشل في البحث عن بدائل الآيسي' }, { status: 500 });
  }
}
