import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json(
      { error: 'نظام المراقبة غير متاح' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'daily';
    const provider = searchParams.get('provider') || null;
    const days = parseInt(searchParams.get('days') || '7');

    let data;
    let error;

    if (type === 'daily') {
      const { data: dailyData, error: dailyError } = await supabaseAdmin.rpc('get_keys_daily_stats');
      data = dailyData;
      error = dailyError;
    } else if (type === 'total') {
      const { data: totalData, error: totalError } = await supabaseAdmin.rpc('get_keys_total_stats');
      data = totalData;
      error = totalError;
    } else if (type === 'details') {
      // @ts-ignore
      const { data: detailsData, error: detailsError } = await supabaseAdmin.rpc('get_keys_details', {
        p_provider: provider,
        p_days: days
      });
      data = detailsData;
      error = detailsError;
    }

    if (error) {
      console.error('Keys stats error:', error);
      return NextResponse.json(
        { error: 'حدث خطأ في جلب البيانات' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      type,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Keys stats API error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
