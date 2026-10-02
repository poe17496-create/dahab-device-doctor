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
    const brand = searchParams.get('brand') || '';

    let supabaseQuery = supabaseAdmin.from('verified_faults').select('*');

    if (query) {
      supabaseQuery = supabaseQuery.or(`fault_title.ilike.%${query}%,symptoms.ilike.%${query}%,diagnosis.ilike.%${query}%`);
    }

    if (brand && brand !== 'all') {
      supabaseQuery = supabaseQuery.ilike('device_model', `%${brand}%`);
    }

    const { data: faults, error } = await supabaseQuery.limit(50);

    if (error) {
      console.error('Error searching verified faults:', error);
      return NextResponse.json({ error: 'فشل في البحث عن الأعطال الشائعة' }, { status: 500 });
    }

    // تحويل البيانات من Supabase إلى الشكل المتوقع
    const results = (faults || []).map((fault: any) => ({
      id: fault.id,
      model: fault.device_model || 'غير محدد',
      brand: fault.device_type || 'Other',
      faultName: fault.fault_title,
      symptoms: fault.symptoms ? fault.symptoms.split(', ') : [],
      suspectedComponent: 'غير محدد',
      measurementTest: fault.diagnosis || 'غير محدد',
      fixSteps: fault.solution ? fault.solution.split(', ') : [],
      successRate: 85,
      isFactoryFault: fault.status === 'verified',
      difficultyLevel: fault.difficulty_level,
      images: fault.media_urls,
      videoUrl: null,
    }));

    return NextResponse.json({ results, source: 'supabase' });
  } catch (error) {
    console.error('Common Faults API error:', error);
    return NextResponse.json({ error: 'فشل في البحث عن الأعطال الشائعة' }, { status: 500 });
  }
}
