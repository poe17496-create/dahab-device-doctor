import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to check if imports are working
 */
export async function GET(req: NextRequest) {
  try {
    // Test basic imports
    const rateLimitResult = await import('@/lib/rate-limit');
    const sanitizeResult = await import('@/lib/sanitize');

    return NextResponse.json({
      success: true,
      imports: {
        rateLimit: !!rateLimitResult,
        sanitize: !!sanitizeResult,
      },
      message: 'All imports working',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
