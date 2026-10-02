import { NextRequest, NextResponse } from 'next/server';
import { getCachedResponse, setCachedResponse, generateCacheKey, getCacheStats } from '@/lib/cache';

export const dynamic = 'force-dynamic';

// Test cache system
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'test';

    if (action === 'stats') {
      const stats = await getCacheStats();
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    if (action === 'clear') {
      const { clearExpiredCache } = await import('@/lib/cache');
      const deletedCount = await clearExpiredCache();
      return NextResponse.json({
        success: true,
        message: 'تم تنظيف الـ Cache المنتهي الصلاحية',
        deletedCount,
      });
    }

    // Test: Write to cache
    const testKey = generateCacheKey('test-message', { test: true });
    const testValue = {
      message: 'هذه رسالة اختبار من نظام الـ Cache',
      timestamp: new Date().toISOString(),
      test: true,
    };

    // Set cache
    const setSuccess = await setCachedResponse(testKey, testValue, 1); // 1 hour TTL
    if (!setSuccess) {
      return NextResponse.json({
        success: false,
        error: 'فشل في حفظ البيانات في الـ Cache',
      });
    }

    // Read from cache
    const cachedValue = await getCachedResponse(testKey);
    if (!cachedValue) {
      return NextResponse.json({
        success: false,
        error: 'فشل في قراءة البيانات من الـ Cache',
      });
    }

    // Get stats
    const stats = await getCacheStats();

    return NextResponse.json({
      success: true,
      message: 'نظام الـ Cache يعمل بشكل صحيح',
      test: {
        write: setSuccess,
        read: !!cachedValue,
        dataMatch: JSON.stringify(cachedValue) === JSON.stringify(testValue),
      },
      stats,
    });
  } catch (error) {
    console.error('Cache test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطأ في اختبار الـ Cache',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
