import { NextRequest, NextResponse } from 'next/server';
import { getKeyPoolStats } from '@/lib/apiKeysStorage';
import { withErrorHandling } from '@/lib/apiErrorHandler';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getKeyPoolStatsHandler(req: NextRequest) {
  const stats = getKeyPoolStats();
  
  return NextResponse.json({
    success: true,
    stats,
    summary: {
      totalKeys: stats.reduce((sum, s) => sum + s.totalKeys, 0),
      totalSuccesses: stats.reduce((sum, s) => sum + s.successCount, 0),
      totalFailures: stats.reduce((sum, s) => sum + s.failureCount, 0),
      providersWithKeys: stats.filter(s => s.totalKeys > 0).length,
    },
  });
}

export const GET = withErrorHandling(getKeyPoolStatsHandler);
