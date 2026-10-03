import { NextRequest, NextResponse } from 'next/server';
import { resetKeyRotation } from '@/lib/apiKeysStorage';
import { withErrorHandling } from '@/lib/apiErrorHandler';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function resetKeyRotationHandler(req: NextRequest) {
  const body = await req.json();
  const { provider } = body;
  
  resetKeyRotation(provider);
  
  return NextResponse.json({
    success: true,
    message: provider 
      ? `Key rotation reset for ${provider}` 
      : 'Key rotation reset for all providers',
  });
}

export const POST = withErrorHandling(resetKeyRotationHandler);
