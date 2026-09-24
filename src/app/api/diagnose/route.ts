import { NextRequest } from 'next/server';
import {
  DAHAB_SYSTEM_PROMPT,
  buildDiagnosticUserPrompt,
} from '@/lib/promptTemplates';
import {
  buildSessionContextForAI,
  appendMessageToSession,
  saveSession,
  getSessionById,
} from '@/lib/jsonMemory';
import { DiagnosticMetrics, DeviceSpecialty, PowerSupplyReadings } from '@/lib/types';
import { callAIEngine, createStreamingResponse, AIEngine } from '@/lib/aiEngines';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { prompt, specialty, deviceModel, readings, imageBase64, sessionId, preferredEngine } =
      await req.json();

    if (!prompt && !imageBase64) {
      return new Response('يجب إدخال وصف للعطل أو رفع صورة', { status: 400 });
    }

    const currentSessionId = sessionId || `session_${Date.now()}`;

    // استخراج سياق الذاكرة المحفوظة من ملفات الـ JSON
    const historyContext = buildSessionContextForAI(currentSessionId);

    const userPrompt = buildDiagnosticUserPrompt({
      userPrompt: prompt || 'تحليل الصورة المرفقة للبوردة أو شاشة القياس',
      specialty: specialty || 'mobile-repair',
      deviceModel,
      readings,
      historyContext,
    });

    // تسجيل رسالة المستخدم في ملف الـ JSON
    appendMessageToSession(currentSessionId, {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      text: prompt,
      imageBase64,
      readings,
    });

    // استدعاء محرك AI المختار أو الأفضل تلقائياً
    const aiResponse = await callAIEngine({
      prompt: userPrompt,
      specialty: specialty || 'mobile-repair',
      deviceModel,
      readings,
      imageBase64,
      preferredEngine: preferredEngine as AIEngine,
    });

    // حفظ رد المساعد في ملف JSON
    appendMessageToSession(currentSessionId, {
      id: `msg_ai_${Date.now()}`,
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      text: aiResponse.text,
      metrics: aiResponse.metrics,
    });

    // إنشاء تدفق البث الحي
    const stream = createStreamingResponse(aiResponse.text);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Session-ID': currentSessionId,
        'X-AI-Engine': aiResponse.engine,
      },
    });
  } catch (error) {
    console.error('خطأ في مسار التشخيص /api/diagnose:', error);
    return new Response('حدث خطأ أثناء إجراء الفحص الهندسي.', { status: 500 });
  }
}
