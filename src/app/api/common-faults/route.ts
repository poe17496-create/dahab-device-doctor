import { NextRequest, NextResponse } from 'next/server';
import commonFaultsData from '@/data/commonFaults.json';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const brand = searchParams.get('brand') || '';

    // البحث في Supabase أولاً إذا كانت مفعلة
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        let supabaseQuery = supabaseAdmin.from('verified_faults').select('*');

        if (query) {
          supabaseQuery = supabaseQuery.or(`fault_description.ilike.%${query}%,fault_code.ilike.%${query}%`);
        }

        if (brand && brand !== 'all') {
          supabaseQuery = supabaseQuery.ilike('fault_code', `%${brand}%`);
        }

        const { data: faults, error } = await supabaseQuery.limit(50);

        if (!error && faults && faults.length > 0) {
          // تحويل البيانات من Supabase إلى الشكل المتوقع
          const results = faults.map((fault: any) => ({
            id: fault.id,
            model: fault.boardview_id || 'غير محدد',
            brand: 'Other',
            faultName: fault.fault_description,
            symptoms: [fault.fault_code],
            suspectedComponent: 'غير محدد',
            measurementTest: fault.solution,
            fixSteps: [fault.solution],
            successRate: 85,
            isFactoryFault: fault.status === 'verified',
          }));

          return NextResponse.json({ results, source: 'supabase' });
        }
      } catch (sbErr) {
        console.warn('Supabase common faults lookup failed, falling back to local:', sbErr);
      }
    }

    // الفallback للبحث المحلي
    let filtered = commonFaultsData;

    if (brand && brand !== 'all') {
      filtered = filtered.filter((fault) => fault.brand === brand);
    }

    if (query) {
      const term = query.toLowerCase();
      filtered = filtered.filter(
        (fault) =>
          fault.model.toLowerCase().includes(term) ||
          fault.faultName.toLowerCase().includes(term) ||
          fault.symptoms.some((s) => s.toLowerCase().includes(term))
      );
    }

    return NextResponse.json({ results: filtered, source: 'local' });
  } catch (error) {
    console.error('Common Faults API error:', error);
    return NextResponse.json({ error: 'فشل في البحث عن الأعطال الشائعة' }, { status: 500 });
  }
}
