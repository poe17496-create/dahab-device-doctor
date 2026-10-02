import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats, clearExpiredCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// GET - Get cache statistics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'clear') {
      const deletedCount = await clearExpiredCache();
      return NextResponse.json({
        message: 'تم تنظيف الـ Cache المنتهي الصلاحية',
        deletedCount,
      });
    }

    const stats = await getCacheStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Cache API error:', error);
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    );
  }
}
