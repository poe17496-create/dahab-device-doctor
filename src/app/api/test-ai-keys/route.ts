import { NextRequest, NextResponse } from 'next/server';

/**
 * Test API Keys Endpoint
 * Checks if AI API keys are configured without exposing them
 */
export async function GET(req: NextRequest) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    return NextResponse.json({
      success: true,
      keys: {
        gemini: !!geminiKey,
        openrouter: !!openrouterKey,
        openai: !!openaiKey,
      },
      message: geminiKey || openrouterKey || openaiKey
        ? 'At least one AI key is configured'
        : 'No AI keys configured. Please add API keys to environment variables.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
