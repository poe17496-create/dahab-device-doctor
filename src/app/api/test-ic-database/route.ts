import { NextRequest, NextResponse } from 'next/server';
import { searchICDatabase } from '@/lib/icDatabase';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Test IC Database with Supabase
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || 'BQ25601';

    console.log('Testing IC Database with query:', query);
    console.log('Supabase configured:', isSupabaseConfigured);

    const startTime = Date.now();
    const results = await searchICDatabase(query);
    const endTime = Date.now();

    return NextResponse.json({
      success: true,
      query,
      source: isSupabaseConfigured ? 'supabase-or-fallback' : 'local-json',
      resultCount: results.length,
      responseTime: `${endTime - startTime}ms`,
      results: results.slice(0, 5), // Return first 5 results
      sampleData: results.length > 0 ? results[0] : null,
    });
  } catch (error: any) {
    console.error('IC Database test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في اختبار قاعدة بيانات IC',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
