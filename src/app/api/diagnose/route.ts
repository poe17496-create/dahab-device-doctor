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
import { findRelevantPatterns } from '@/lib/expertKnowledge';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { prompt, specialty, deviceModel, readings, imageBase64, sessionId, preferredEngine, customKeys } =
      await req.json();

    if (!prompt && !imageBase64) {
      return new Response('يجب إدخال وصف للعطل أو رفع صورة', { status: 400 });
    }

    const currentSessionId = sessionId || `session_${Date.now()}`;

    // استخراج سياق الذاكرة المحفوظة من ملفات الـ JSON
    const historyContext = buildSessionContextForAI(currentSessionId);

    let userPrompt = buildDiagnosticUserPrompt({
      userPrompt: prompt || 'تحليل الصورة المرفقة للبوردة أو شاشة القياس',
      specialty: specialty || 'mobile-repair',
      deviceModel,
      readings,
      historyContext,
    });

    // البحث عن الأنماط الخبيرة ودمجها
    const relevantPatterns = findRelevantPatterns(prompt || '', specialty);
    if (relevantPatterns.length > 0) {
      userPrompt += `\n\n### Expert Reference Data\n`;
      userPrompt += `Rule X: If expert repair patterns are provided below, use them as primary reference and incorporate their specific component IDs (like PQ301, PU201, etc.) into your diagnosis.\n\n`;
      relevantPatterns.forEach((p, index) => {
        userPrompt += `Pattern ${index + 1}:\n- Symptom: ${p.symptom}\n- Solution: ${p.solution}\n- Category: ${p.category}\n\n`;
      });
    }

    // تسجيل رسالة المستخدم في ملف الـ JSON
    appendMessageToSession(currentSessionId, {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      text: prompt,
      imageBase64,
      readings,
    });

    // استدعاء محرك AI المختار أو الأفضل تلقائياً مع تدوير كافة المفاتيح
    const aiResponse = await callAIEngine({
      prompt: userPrompt,
      specialty: specialty || 'mobile-repair',
      deviceModel,
      readings,
      imageBase64,
      preferredEngine: preferredEngine as AIEngine,
      customKeys,
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
