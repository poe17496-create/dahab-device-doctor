import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  const report: {
    timestamp: string;
    checks: {
      environmentVariables: boolean;
      supabaseConfigured: boolean;
      connectionTest: boolean;
      tablesTest: boolean;
    };
    details: any;
    errors: string[];
    status: 'success' | 'partial' | 'failed';
  } = {
    timestamp: new Date().toISOString(),
    checks: {
      environmentVariables: false,
      supabaseConfigured: false,
      connectionTest: false,
      tablesTest: false,
    },
    details: {} as any,
    errors: [] as string[],
    status: 'failed',
  };

  // 1. تحقق من متغيرات البيئة
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  report.details.environmentVariables = {
    urlConfigured: !!supabaseUrl,
    anonKeyConfigured: !!supabaseAnonKey,
    serviceRoleKeyConfigured: !!supabaseServiceRoleKey,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'none',
  };

  if (supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey) {
    report.checks.environmentVariables = true;
  } else {
    report.errors.push('Missing environment variables');
  }

  // 2. تحقق من تكوين Supabase
  report.checks.supabaseConfigured = isSupabaseConfigured;

  if (!isSupabaseConfigured) {
    return NextResponse.json(report);
  }

  // 3. اختبار الاتصال البسيط
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error) {
      report.errors.push(`Connection test failed: ${error.message}`);
    } else {
      report.checks.connectionTest = true;
      report.details.usersCount = data;
    }
  } catch (err: any) {
    report.errors.push(`Connection test error: ${err.message}`);
  }

  // 4. اختبار الجداول المختلفة
  const tables = ['users', 'boardviews', 'verified_faults', 'ic_database', 'ratings', 'discussions', 'replies', 'tutorials', 'cache_entries', 'diagnosis_history'];
  const tableStatus: any = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('count', { count: 'exact', head: true });

      if (error) {
        tableStatus[table] = { status: 'error', message: error.message };
      } else {
        tableStatus[table] = { status: 'accessible', count: data };
      }
    } catch (err: any) {
      tableStatus[table] = { status: 'error', message: err.message };
    }
  }

  report.details.tables = tableStatus;
  report.checks.tablesTest = Object.values(tableStatus).every((t: any) => t.status === 'accessible');

  // الحالة النهائية
  const allChecksPassed = Object.values(report.checks).every((check) => check === true);
  report.status = allChecksPassed ? 'success' : 'partial';

  return NextResponse.json(report);
}
