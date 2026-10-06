import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Test endpoint to check if Gemini API is working
 */
export async function POST(req: NextRequest) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!geminiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'No Gemini API key found',
          keys: {
            gemini: !!process.env.GEMINI_API_KEY,
            google: !!process.env.GOOGLE_API_KEY,
          },
        },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

    // Simple text test
    const result = await model.generateContent('Hello, can you respond with "Working"?');

    return NextResponse.json({
      success: true,
      response: result.response.text(),
      message: 'Gemini API is working',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        errorDetails: {
          name: error.name,
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}
