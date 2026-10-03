import { NextRequest, NextResponse } from 'next/server';
import { callAIEngine } from '@/lib/aiEngines';
import { buildExpertPromptContext } from '@/lib/expertKnowledge';
import { buildExpertSystemPrompt, getRelevantCaseStudies, getEngineeringReferences, extractComponentsFromText } from '@/lib/expertSystemService';
import { buildEnhancedPrompt, buildSchematicContext } from '@/lib/smartAnalysisSystem';
import { checkRateLimit, sanitizeAndCheckTokenDrain } from '@/lib/securityRateLimiter';
import { withErrorHandling, ErrorCode, withTimeout } from '@/lib/apiErrorHandler';
import { chatRequestSchema } from '@/lib/apiSchemas';
import { getCachedResponse, setCachedResponse, generateCacheKey } from '@/lib/cache';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { generateUserIdentifier } from '@/lib/userFingerprint';
import { validateSessionToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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

  // التحقق من المستخدم المسجل (skip usage limit for logged-in users)
  const { username, sessionToken } = body;

  let isUserLoggedIn = false;
  if (username && sessionToken && isSupabaseConfigured) {
    try {
      isUserLoggedIn = await validateSessionToken(username, sessionToken);
      console.log(`User ${username} login validation: ${isUserLoggedIn}`);
    } catch (error) {
      console.error('Error validating session:', error);
    }
  }

  // 🎯 تتبع الاستخدام اليومي عبر Device Fingerprint المحسن (IP + User Agent + Cookie)
  // يتم تطبيق الحد فقط على الزوار غير المسجلين
  let needsCookie = false;
  let sessionId = '';
  if (isSupabaseConfigured && supabaseAdmin && !isUserLoggedIn) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Usage check timeout')), 3000)
      );

      // Generate comprehensive user identifier
      const { combinedId, sessionId: newSessionId } = generateUserIdentifier(req);
      sessionId = newSessionId;

      // التحقق من الاستخدام وزيادة العداد مع timeout
      const usageCheckPromise = supabaseAdmin.rpc('check_and_increment_usage', {
        p_ip_address: combinedId // Use combined ID instead of just IP
      });

      const { data: usageResult, error: usageError } = await Promise.race([usageCheckPromise, timeoutPromise]);

      if (usageError) {
        console.error('Usage tracking error:', usageError);
        // في حالة الخطأ، نسمح بالطلب ولكن نسجل الخطأ
      } else if (usageResult && !usageResult.allowed) {
        // تم تجاوز الحد المسموح
        return NextResponse.json(
          {
            error: usageResult.message,
            currentCount: usageResult.current_count,
            maxAllowed: usageResult.max_allowed,
            requiresReset: true
          },
          { status: 429 }
        );
      }

      // Check if we need to set session cookie
      const existingCookie = req.headers.get('cookie') || '';
      needsCookie = !existingCookie.includes('dahab_session=');
    } catch (error) {
      console.error('Error checking usage:', error);
      // في حالة الخطأ، نسمح بالطلب لتجنب تعطيل الخدمة
    }
  }
  
  // التحقق من صحة البيانات باستخدام Zod
  const validatedData = chatRequestSchema.parse(body);
  const { message, imageBase64, chatHistory, customKeys, stream = false, diagnosticContext } = validatedData;

  // 🛡️ فحص حماية استنزاف التوكن (Token Drain Protection)
  if (message && message.length > 0) {
    const tokenCheck = sanitizeAndCheckTokenDrain(message);
    if (!tokenCheck.valid) {
      return NextResponse.json({ error: tokenCheck.error }, { status: 400 });
    }
  }

  if (!message && !imageBase64) {
    return NextResponse.json({ error: 'الرسالة فارغة' }, { status: 400 });
  }

  console.log('=== Chat API Request ===');
  console.log('Message:', message);
  console.log('Has Image:', !!imageBase64);
  console.log('Chat History Length:', chatHistory?.length || 0);
  console.log('Stream Mode:', stream);

  // بناء سياق تاريخ المحادثة المحسن
  let contextPrompt = '';
  if (chatHistory && chatHistory.length > 0) {
    const recentHistory = chatHistory.slice(-8); // زيادة الذاكرة من 6 إلى 8
    contextPrompt = '\nسجل المحادثة السابق مع الفني (تحليل السياق المستمر):\n';
    
    // تحليل ذكي للتاريخ
    let currentFault = '';
    let previousDiagnoses: string[] = [];
    let attemptedSolutions: string[] = [];
    
    recentHistory.forEach((msg: any, index: any) => {
      if (msg.role === 'user') {
        contextPrompt += `الفني [الرسالة ${index + 1}]: ${msg.content}\n`;
        // استخراج الأعطال المذكورة
        if (msg.content.includes('شورت') || msg.content.includes('سحب') || msg.content.includes('لا يعمل')) {
          currentFault = msg.content;
        }
      } else if (msg.role === 'assistant') {
        contextPrompt += `المساعد [الرد ${index + 1}]: ${msg.content}\n`;
        // استخراج التشخيصات والحلول المقترحة
        if (msg.content.includes('تشخيص') || msg.content.includes('يبدو أن')) {
          previousDiagnoses.push(msg.content);
        }
        if (msg.content.includes('ينصح') || msg.content.includes('خطوة') || msg.content.includes('افحص')) {
          attemptedSolutions.push(msg.content);
        }
      }
    });
    
    // إضافة ملخص ذكي للسياق
    if (currentFault) {
      contextPrompt += `\n📊 ملخص السياق:\n`;
      contextPrompt += `- العطل الحالي: ${currentFault}\n`;
      if (previousDiagnoses.length > 0) {
        contextPrompt += `- التشخيصات السابقة: ${previousDiagnoses.length} تشخيص\n`;
      }
      if (attemptedSolutions.length > 0) {
        contextPrompt += `- الحلول المقترحة سابقاً: ${attemptedSolutions.length} حل\n`;
      }
      contextPrompt += `- يجب أن تقدم تشخيصاً متقدماً يبنى على المحاولات السابقة\n`;
    }
    
    contextPrompt += '\n--- نهاية السجل السابق ---\n\n';
  }

  // استخراج بيانات المخططات والبوردات وقاعدة الخبرات المضغوطة للمساعد
  const expertContext = buildExpertPromptContext(message || '');

  // إضافة سياق التشخيص والبوردفيو للنظام
  let contextInfo = '';
  let expertSystemContext = '';

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

    // Fetch expert system data if device info is available
    try {
      const deviceBrand = diagnosticContext.deviceModel?.split(' ')[0] || 'Unknown';
      const deviceModel = diagnosticContext.deviceModel || '';
      const symptoms = [];

      // Extract symptoms from message or readings
      if (message) {
        if (message.includes('شورت')) symptoms.push('short circuit');
        if (message.includes('سحب')) symptoms.push('power draw');
        if (message.includes('لا يعمل')) symptoms.push('not working');
        if (message.includes('حار')) symptoms.push('overheating');
      }

      // Extract components from message
      const extractedComponents = extractComponentsFromText(message || '');

      if (symptoms.length > 0 || deviceModel || extractedComponents.length > 0) {
        // Use enhanced prompt with schematic analysis if board data is available
        if (diagnosticContext.boardData) {
          const schematicData = `${diagnosticContext.boardData.title} ${extractedComponents.join(' ')}`;
          expertSystemContext = await buildEnhancedPrompt(
            deviceBrand,
            deviceModel,
            symptoms,
            schematicData,
            message || ''
          );
        } else {
          expertSystemContext = await buildExpertSystemPrompt(
            deviceBrand,
            deviceModel,
            symptoms,
            message || ''
          );
        }
      }
    } catch (error) {
      console.error('Error fetching expert system data:', error);
      // Continue without expert system context if it fails
    }
  }

  // System prompt للمساعد الذكي المحسن مع المراجع الخارجية
  const systemPrompt = `أنت كبير مهندسي وفنيي الإلكترونيات ومستشار الصيانة الذكي في منظومة "دهب دكتور" (Dahab Device Doctor).
مهمتك مساعدة فنيي الصيانة ومهندسي الإلكترونيات في تشخيص أعطال الموبايل، واللابتوب، والماك بوك، وكروت الباور بدقة واحترافية وبأسلوب محادثة عملي وتفاعلي.

قواعدك الأساسية:
1. تحدث باللغة العربية بأسلوب محادثة راقٍ ومباشر وسهل الفهم لمهندسي وفنيي الورش.
2. استخدم المصطلحات الهندسية الدقيقة (مثل: Diode Mode, VDD_MAIN, VPH_PWR, BUCK Coils, Rosin Smoke, Short to GND, Bootloop, DFU, EDL 9008).
3. عند السؤال عن عطل، قدم خطوات الفحص المنطقية بالترتيب (1، 2، 3) مع تحديد الفولتات والممانعات النموذجية.
4. إذا أرفق الفني صورة مخطط هندسي (Schematic)، بوردفيو (Boardview)، أو بوردة إلكترونية: اقرأ جميع الرموز والمكونات (U, R, C, L, Q) وأسماء مسارات التغذية والجهود المكتوبة في الصورة بدقة واستند إليها مباشرة في إجابتك.
5. حدود أمان حقن الفولت الصارمة: يُحظر نهائياً اقتراح حقن فولت أعلى من 3.8V أو تيار أعلى من 3.0A لخطوط الباور الرئيسية، ويُحظر حقن أكثر من 0.9V لخطوط المعالج. انصح دائماً بالبدء بجهد 1.0V-1.8V وتيار 1A تدريجياً، والتأكيد على مراجعة الممانعة بوضع الدايود قبل الحقن.
6. تذكر سياق الحوار السابق وأجب بذكاء وترابط، وإذا كان استفساراً عاماً أو تحية، رحب بالفني بحرارة وسله عن الجهاز أو البوردة التي يعمل عليه.
7. لديك وصول لقاعدة بيانات خبراء الصيانة المتخصصين. عند وجود بيانات مرجعية من قاعدة الخبرات في الرسالة، استخدمها كمرجع أول وادمج أكواد المكونات (مثل PQ301, PU201) في إجابتك.
8. استخدم سياق الجهاز الحالي (الموديل، القراءات، نتائج التشخيص) لتقديم إجابات أكثر دقة وملاءمة للحالة المحددة.

قواعد استخدام المراجع الهندسية الخارجية (200+ مصدر):
9. لديك وصول لقاعدة بيانات ضخمة من المراجع الهندسية تشمل:
   - Datasheets رسمية من Texas Instruments, Qualcomm, Apple, Samsung, Realtek, وغيرها
   - مخططات هندسية كاملة (Schematics) لأجهزة iPhone و Samsung وغيرها
   - مراجع تقنية لمكونات الطاقة، الصوت، الواي فاي، والمعالجات
10. عند ذكر مكون (مثل BQ25601, PM8150, 1610A3)، استخدم المراجع الخارجية لتقديم معلومات دقيقة عنه.
11. قم بقراءة المخططات الهندسية المرفقة واستخراج المكونات والمسارات بدقة.
12. استخدم المراجع الهندسية لدعم تشخيصك وتقديم قيم الفولت والممانعة الصحيحة.
13. اربط بين المخططات والمراجع الخارجية والخبرات العملية لتقديم تحليل شامل.

قواعد التتبع الذكي للسياق المستمر:
14. تتبع تقدم الفني: إذا كان الفني قد جرب حلولاً سابقاً، لا تكررها. بدلاً من ذلك، اقترح حلولاً بديلة أو أعمق.
15. التعلم من المحاولات السابقة: إذا فشل حل سابق، اشرح لماذا قد يكون فشل واقترح نهجاً مختلفاً.
16. التعمق التدريجي: مع كل رسالة جديدة، قدم تحليلاً أعمق بناءً على المعلومات الجديدة.
17. الربط بين المعلومات: اربط بين الأعراض المختلفة والمكونات المحتملة بناءً على السياق التراكمي.
18. التنبؤ بالنتائج: بناءً على القراءات والأعراض، تنبأ بالاحتمالات الأكثر شيوعاً وقدم خطوات للتحقق منها.

أسلوب الإجابة المتقدم:
- ابدأ دائماً بتلخيص الوضع الحالي بناءً على السياق المتراكم
- استخدم المراجع الهندسية الخارجية (Datasheets, Schematics) لدعم إجابتك
- اقرأ المخططات الهندسية بدقة واستخرج المكونات والمسارات
- إذا كان هناك تشخيص سابق، راجعه وحدد ما تم وما لم يتم فحصه
- قدم خطوات جديدة تتكامل مع ما تم فعله سابقاً
- اختم بتوجيه الفني للخطوة التالية المنطقية
- كن دقيقاً في استخدام المكونات المذكورة في المراجع الخارجية`;

  // إنشاء مفتاح Cache للطلب
  const cacheKey = generateCacheKey(
    message + expertContext + contextInfo + expertSystemContext,
    {
      specialty: diagnosticContext?.specialty,
      deviceModel: diagnosticContext?.deviceModel,
      hasImage: !!imageBase64,
      readings: diagnosticContext?.readings,
    }
  );

  // التحقق من Cache قبل استدعاء AI
  const cachedResponse = await getCachedResponse(cacheKey);
  if (cachedResponse && !stream) {
    console.log('Cache HIT - Returning cached response');
    return NextResponse.json({
      message: cachedResponse.message,
      engine: cachedResponse.engine || 'cache',
      modelUsed: cachedResponse.modelUsed || 'cached',
      fromCache: true,
      debug: {
        cacheHit: true,
        geminiKeysCount: (process.env.GEMINI_API_KEY || '').split(/[\n,;]+/).filter(Boolean).length,
        openaiKeysCount: (process.env.OPENAI_API_KEY || '').split(/[\n,;]+/).filter(Boolean).length,
        openrouterKeysCount: (process.env.OPENROUTER_API_KEY || '').split(/[\n,;]+/).filter(Boolean).length,
      },
    });
  }

  // استدعاء محرك الذكاء الاصطناعي مع timeout safeguard
  const aiResponse = await withTimeout(
    callAIEngine({
      prompt: contextPrompt + contextInfo + expertSystemContext + message + expertContext,
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
    60000, // 1 minute timeout (reduced from 2 minutes)
    'انتهت مهلة طلب الذكاء الاصطناعي'
  );

  // Streaming mode - return SSE stream
  if (stream && aiResponse.stream) {
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const reader = aiResponse.stream!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // إرسال الـ chunk فوراً كما هو للموبايل (بدون تجميع)
            if (chunk.length > 0) {
              const sseChunk = JSON.stringify({ chunk });
              controller.enqueue(encoder.encode(`data: ${sseChunk}\n\n`));
            }
          }

          // Send completion event with engine info
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, engine: aiResponse.engine, modelUsed: aiResponse.modelUsed, metrics: aiResponse.metrics })}\n\n`));
          controller.close();
        } catch (err) {
          // Send error event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error', message: err instanceof Error ? err.message : 'Unknown error' })}\n\n`));
          controller.close();
        }
      },
    });

    const response = new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, no-transform, must-revalidate, max-age=0',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // تعطيل buffering في nginx
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    });

    // Set session cookie if needed
    if (needsCookie && sessionId) {
      response.cookies.set('dahab_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });
    }

    return response;
  }

  // Non-streaming mode (original)
  const cleanedMessage = cleanAIResponse(aiResponse.text);

  // حفظ الإجابة في الـ Cache للاستخدامات القادمة
  if (!stream && cleanedMessage) {
    await setCachedResponse(cacheKey, {
      message: cleanedMessage,
      engine: aiResponse.engine,
      modelUsed: aiResponse.modelUsed || 'default',
      timestamp: new Date().toISOString(),
    }, 24); // Cache لمدة 24 ساعة
  }

  const response = NextResponse.json({
    message: cleanedMessage || aiResponse.text,
    engine: aiResponse.engine,
    modelUsed: aiResponse.modelUsed || 'default',
    errorLog: aiResponse.errorLog,
    fromCache: false,
    debug: {
      cacheHit: false,
      geminiKeysCount: (process.env.GEMINI_API_KEY || '').split(/[\n,;]+/).filter(Boolean).length,
      openaiKeysCount: (process.env.OPENAI_API_KEY || '').split(/[\n,;]+/).filter(Boolean).length,
      openrouterKeysCount: (process.env.OPENROUTER_API_KEY || '').split(/[\n,;]+/).filter(Boolean).length,
    },
  });

  // Set session cookie if needed
  if (needsCookie && sessionId) {
    response.cookies.set('dahab_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
  }

  return response;
}

export const POST = withErrorHandling(chatHandler);
