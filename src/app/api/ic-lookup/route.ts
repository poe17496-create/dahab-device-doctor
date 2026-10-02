import { NextRequest, NextResponse } from 'next/server';
import { searchICDatabase } from '@/lib/icDatabase';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchICDatabase(query);

    return NextResponse.json({
      results,
      source: isSupabaseConfigured ? 'supabase' : 'local-json',
      count: results.length,
    });
  } catch (error) {
    console.error('IC Lookup API error:', error);
    return NextResponse.json({ error: 'فشل في البحث عن بدائل الآيسي' }, { status: 500 });
  }
}
