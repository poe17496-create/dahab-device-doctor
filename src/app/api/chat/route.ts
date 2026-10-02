import { NextRequest, NextResponse } from 'next/server';
import { callAIEngine } from '@/lib/aiEngines';
import { buildExpertPromptContext } from '@/lib/expertKnowledge';
import { checkRateLimit, sanitizeAndCheckTokenDrain } from '@/lib/securityRateLimiter';
import { withErrorHandling, ErrorCode, withTimeout } from '@/lib/apiErrorHandler';
import { chatRequestSchema } from '@/lib/apiSchemas';

export const dynamic = 'force-dynamic';

// دالة لتنظيف النص من كتل الميتريكس غير المرغوبة فقط مع الحفاظ الكامل على نص المحادثة والخطوات
function cleanAIResponse(text: string): string {
  let cleaned = text;

  // إزالة كتل الميتريكس البرمجية فقط
  cleaned = cleaned.replace(/<<<DAHAB_DIAGNOSTIC_METRICS>>>[\s\S]*?<<<END_DAHAB_METRICS>>>/g, '');

  // إزالة المسافات والأسطر الفارغة المتعددة
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

async function chatHandler(req: NextRequest) {
  // 🛡️ فحص حماية DDoS ومعدل الطلبات
  const rateCheck = checkRateLimit(req, 25, 60 * 1000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `🛡️ تم تجاوز الحد المسموح للطلبات (${rateCheck.resetInSec} ثانية متبقية). يرجى التمهل.` },
      { status: 429 }
    );
  }

  const body = await req.json();
  
  // التحقق من صحة البيانات باستخدام Zod
  const validatedData = chatRequestSchema.parse(body);
  const { message, imageBase64, chatHistory, customKeys, stream = false, diagnosticContext } = validatedData;

  // 🛡️ فحص حماية استنزاف التوكن (Token Drain Protection)
  const tokenCheck = sanitizeAndCheckTokenDrain(message || '');
  if (!tokenCheck.valid) {
    return NextResponse.json({ error: tokenCheck.error }, { status: 400 });
  }

  if (!message && !imageBase64) {
    return NextResponse.json({ error: 'الرسالة فارغة' }, { status: 400 });
  }

  console.log('=== Chat API Request ===');
  console.log('Message:', message);
  console.log('Has Image:', !!imageBase64);
  console.log('Chat History Length:', chatHistory?.length || 0);
  console.log('Stream Mode:', stream);

  // بناء سياق تاريخ المحادثة
  let contextPrompt = '';
  if (chatHistory && chatHistory.length > 0) {
    const recentHistory = chatHistory.slice(-6);
    contextPrompt = '\nسجل المحادثة السابق مع الفني:\n';
    recentHistory.forEach((msg: any) => {
      if (msg.role === 'user') {
        contextPrompt += `الفني: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        contextPrompt += `المساعد: ${msg.content}\n`;
      }
    });
    contextPrompt += '--- نهاية السجل السابق ---\n\n';
  }

  // استخراج بيانات المخططات والبوردات وقاعدة الخبرات المضغوطة للمساعد
  const expertContext = buildExpertPromptContext(message || '');

  // إضافة سياق التشخيص والبوردفيو للنظام
  let contextInfo = '';
  if (diagnosticContext) {
    contextInfo = '\n\n--- سياق الجهاز الحالي ---\n';
    if (diagnosticContext.deviceModel) {
      contextInfo += `الموديل: ${diagnosticContext.deviceModel}\n`;
    }
    if (diagnosticContext.specialty) {
      contextInfo += `التصنيف: ${diagnosticContext.specialty}\n`;
    }
    if (diagnosticContext.readings && Object.keys(diagnosticContext.readings).length > 0) {
      contextInfo += `قراءات الباور: ${JSON.stringify(diagnosticContext.readings)}\n`;
    }
    if (diagnosticContext.metrics) {
      contextInfo += `نتائج التشخيص: ${JSON.stringify(diagnosticContext.metrics)}\n`;
    }
    if (diagnosticContext.boardData) {
      contextInfo += `بيانات البوردفيو: ${diagnosticContext.boardData.title} (${diagnosticContext.boardData.deviceModel})\n`;
    }
    if (diagnosticContext.calculatorContext) {
      contextInfo += `حاسبة حقن الفولت:\n`;
      contextInfo += `- المسار المختار: ${diagnosticContext.calculatorContext.selectedRail}\n`;
      contextInfo += `- الفولت المقترح: ${diagnosticContext.calculatorContext.recommendedVoltage}V\n`;
      contextInfo += `- أقصى فولت مسموح: ${diagnosticContext.calculatorContext.maxSafeVoltage}V\n`;
      contextInfo += `- حد الأمبير: ${diagnosticContext.calculatorContext.maxSafeCurrent}A\n`;
    }
    if (diagnosticContext.checklistProgress) {
      contextInfo += `قائمة الفحص:\n`;
      contextInfo += `- الإجمالي: ${diagnosticContext.checklistProgress.total}\n`;
      contextInfo += `- المكتمل: ${diagnosticContext.checklistProgress.completed}\n`;
      if (diagnosticContext.checklistProgress.items && diagnosticContext.checklistProgress.items.length > 0) {
        const pendingItems = diagnosticContext.checklistProgress.items.filter((i: any) => !i.checked);
        if (pendingItems.length > 0) {
          contextInfo += `- النقاط المتبقية: ${pendingItems.map((i: any) => i.label).join(', ')}\n`;
        }
      }
    }
    contextInfo += '--- نهاية سياق الجهاز ---\n';
  }

  // System prompt للمساعد الذكي
  const systemPrompt = `أنت كبير مهندسي وفنيي الإلكترونيات ومستشار الصيانة الذكي في منظومة "دهب دكتور" (Dahab Device Doctor).
مهمتك مساعدة فنيي الصيانة ومهندسي الإلكترونيات في تشخيص أعطال الموبايل، واللابتوب، والماك بوك، وكروت الباور بدقة واحترافية وبأسلوب محادثة عملي وتفاعلي.

قواعدك الأساسية:
1. تحدث باللغة العربية بأسلوب محادثة راقٍ ومباشر وسهل الفهم لمهندسي وفنيي الورش.
2. استخدم المصطلحات الهندسية الدقيقة (مثل: Diode Mode, VDD_MAIN, VPH_PWR, BUCK Coils, Rosin Smoke, Short to GND, Bootloop, DFU, EDL 9008).
3. عند السؤال عن عطل، قدم خطوات الفحص المنطقية بالترتيب (1، 2، 3) مع تحديد الفولتات والممانعات النموذجية.
4. إذا أرفق الفني صورة مخطط هندسي (Schematic)، بوردفيو (Boardview)، أو بوردة إلكترونية: اقرأ جميع الرموز والمكونات (U, R, C, L, Q) وأسماء مسارات التغذية والجهود المكتوبة في الصورة بدقة واستند إليها مباشرة في إجابتك.
5. حدود أمان حقن الفولت الصارمة: يُحظر نهائياً اقتراح حقن فولت أعلى من 3.8V أو تيار أعلى من 3.0A لخطوط الباور الرئيسية، ويُحظر حقن أكثر من 0.9V لخطوط المعالج. انصح دائماً بالبدء بجهد 1.0V-1.8V وتيار 1A تدريجياً، والتأكيد على مراجعة الممانعة بوضع الدايود قبل الحقن.
6. تذكر سياق الحوار السابق وأجب بذكاء وترابط، وإذا كان استفساراً عاماً أو تحية، رحب بالفني بحرارة وسله عن الجهاز أو البوردة التي يعمل عليها.
7. لديك وصول لقاعدة بيانات خبراء الصيانة المتخصصين. عند وجود بيانات مرجعية من قاعدة الخبرات في الرسالة، استخدمها كمرجع أول وادمج أكواد المكونات (مثل PQ301, PU201) في إجابتك.
8. استخدم سياق الجهاز الحالي (الموديل، القراءات، نتائج التشخيص) لتقديم إجابات أكثر دقة وملاءمة للحالة المحددة.`;

  // استدعاء محرك الذكاء الاصطناعي مع timeout safeguard
  const aiResponse = await withTimeout(
    callAIEngine({
      prompt: contextPrompt + contextInfo + message + expertContext,
      specialty: (diagnosticContext?.specialty as any) || 'mobile-repair',
      deviceModel: diagnosticContext?.deviceModel || 'General',
      readings: diagnosticContext?.readings || {},
      imageBase64: imageBase64 || undefined,
      preferredEngine: 'gemini',
      systemPrompt,
      skipEnhancement: true,
      stream,
      customKeys,
    }),
    120000, // 2 minutes timeout
    'انتهت مهلة طلب الذكاء الاصطناعي'
  );

  // Streaming mode - return SSE stream
  if (stream && aiResponse.stream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = aiResponse.stream!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Send chunks as SSE events
            if (buffer.length > 0) {
              const chunk = JSON.stringify({ chunk: buffer });
              controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
              buffer = '';
            }
          }

          // Send completion event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, engine: aiResponse.engine, modelUsed: aiResponse.modelUsed })}\n\n`));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  // Non-streaming mode (original)
  const cleanedMessage = cleanAIResponse(aiResponse.text);

  return NextResponse.json({
    message: cleanedMessage || aiResponse.text,
    engine: aiResponse.engine,
    modelUsed: aiResponse.modelUsed || 'default',
    errorLog: aiResponse.errorLog,
    debug: {
      geminiKeysCount: (process.env.GEMINI_API_KEY || '').split(/[\n,;]+/).filter(Boolean).length,
      openaiKeysCount: (process.env.OPENAI_API_KEY || '').split(/[\n,;]+/).filter(Boolean).length,
      openrouterKeysCount: (process.env.OPENROUTER_API_KEY || '').split(/[\n,;]+/).filter(Boolean).length,
    },
  });
}

export const POST = withErrorHandling(chatHandler, chatRequestSchema);
