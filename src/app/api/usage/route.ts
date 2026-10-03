import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json(
      { error: 'نظام التتبع غير متاح' },
      { status: 503 }
    );
  }

  try {
    // استخراج الـ IP الحقيقي
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'anonymous';

    // الحصول على عدد الطلبات المتبقية
    const { data: remaining, error } = await supabaseAdmin.rpc('get_remaining_requests', {
      p_ip_address: ip
    });

    if (error) {
      console.error('Error getting remaining requests:', error);
      return NextResponse.json(
        { error: 'حدث خطأ في جلب البيانات' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      remaining: remaining || 5,
      maxAllowed: 5,
      ip: ip
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
