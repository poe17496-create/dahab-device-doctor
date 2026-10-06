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
import { buildExpertPromptContext } from '@/lib/expertKnowledge';
import { checkRateLimit, sanitizeAndCheckTokenDrain } from '@/lib/securityRateLimiter';
import { getGuestRemainingTrials, MAX_GUEST_DAILY_TRIALS } from '@/lib/guestUsage';
import { checkAndIncrementGuestTrials } from '@/lib/guestTrialsSupabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // 🛡️ فحص حماية DDoS ومعدل الطلبات
    const rateCheck = checkRateLimit(req, 25, 60 * 1000);
    if (!rateCheck.allowed) {
      return new Response(
        `🛡️ تم تجاوز الحد المسموح للطلبات في الدقيقة (${rateCheck.resetInSec} ثانية متبقية). يرجى التمهل لحماية موارد السيرفر.`,
        { status: 429 }
      );
    }

    const { prompt, specialty, deviceModel, readings, imageBase64, sessionId, preferredEngine, customKeys, isGuest } =
      await req.json();

    // 🛡️ التحقق من حالة الزائر وعدد التجارب المتبقية (من Supabase)
    if (isGuest === true) {
      const trialCheck = await checkAndIncrementGuestTrials(req);
      if (!trialCheck.success) {
        return new Response(
          trialCheck.error || '⚠️ انتهت تجاربك المجانية اليومية (5 من 5).\n\nللحصول على وصول غير محدود للتشخيص ومحاكي البورد فيو والمساعد، سجّل الدخول بحساب فني معتمد أو تواصل مع المطور م. إسلام دهب على واتساب: 01064147224',
          { status: 429 }
        );
      }
    }

    // 🛡️ فحص حماية استنزاف التوكن (Token Drain Protection)
    const tokenCheck = sanitizeAndCheckTokenDrain(prompt || '');
    if (!tokenCheck.valid) {
      return new Response(tokenCheck.error || 'النص طويل جداً', { status: 400 });
    }

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

    // استخراج بيانات المخططات والأنماط المرجعية المضغوطة ودمجها فوراً
    const expertContext = buildExpertPromptContext(prompt || '', specialty, deviceModel);
    if (expertContext) {
      userPrompt += `\n${expertContext}`;
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
