import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // فحص الإعدادات
    const config = {
      isConfigured: isSupabaseConfigured,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Not set',
    };

    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Supabase is not configured',
        config,
      });
    }

    // اختبار الاتصال بقراءة جدول users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    // اختبار الاتصال بقراءة جدول ic_database
    const { data: icData, error: icError } = await supabaseAdmin
      .from('ic_database')
      .select('count')
      .limit(1);

    // اختبار الاتصال بقراءة جدول verified_faults
    const { data: faultsData, error: faultsError } = await supabaseAdmin
      .from('verified_faults')
      .select('count')
      .limit(1);

    const results = {
      users: usersError ? { error: usersError.message } : { success: true },
      ic_database: icError ? { error: icError.message } : { success: true },
      verified_faults: faultsData ? { success: true } : { error: faultsError?.message || 'Table might not exist' },
    };

    // إذا كانت جميع الجداول موجودة
    const allTablesExist = !usersError && !icError;

    return NextResponse.json({
      success: true,
      message: allTablesExist ? '✅ Supabase is connected and working!' : '⚠️ Supabase is connected but some tables are missing',
      config,
      results,
      tablesStatus: {
        users: !usersError ? '✅ Exists' : '❌ Error',
        ic_database: !icError ? '✅ Exists' : '❌ Error',
        verified_faults: !faultsError ? '✅ Exists' : '❌ Missing',
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Error testing Supabase connection',
      error: error.message,
    }, { status: 500 });
  }
}
