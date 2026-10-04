import { NextRequest, NextResponse } from 'next/server';
import type { BoardData } from '@/components/InteractiveBoardviewSimulator';

export const dynamic = 'force-dynamic';

// This API is now deprecated - board data is embedded in InteractiveBoardviewSimulator
// Kept for backwards compatibility, but returns empty data
export async function GET(req: NextRequest) {
  return NextResponse.json({
    boards: [],
    message: 'Board data is now embedded in InteractiveBoardviewSimulator component'
  });
}
