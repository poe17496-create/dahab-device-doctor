import { NextRequest, NextResponse } from 'next/server';
import { callAIEngine } from '@/lib/aiEngines';

export async function POST(req: NextRequest) {
  try {
    const { message, imageBase64 } = await req.json();

    // استدعاء الذكاء الاصطناعي الحقيقي
    const aiResponse = await callAIEngine({
      prompt: message,
      specialty: 'mobile-repair',
      deviceModel: 'General',
      readings: {},
      imageBase64: imageBase64 || null,
      preferredEngine: 'gemini', // يمكن تغييره حسب التفضيل
    });

    return NextResponse.json({
      message: aiResponse.text,
      engine: aiResponse.engine,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'فشل في معالجة الطلب' },
      { status: 500 }
    );
  }
}
