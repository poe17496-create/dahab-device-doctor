import { NextRequest, NextResponse } from 'next/server';
import { callAIEngine } from '@/lib/aiEngines';
import { buildExpertPromptContext } from '@/lib/expertKnowledge';
import { checkRateLimit, sanitizeAndCheckTokenDrain } from '@/lib/securityRateLimiter';

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

export async function POST(req: NextRequest) {
  try {
    // 🛡️ فحص حماية DDoS ومعدل الطلبات
    const rateCheck = checkRateLimit(req, 25, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `🛡️ تم تجاوز الحد المسموح للطلبات (${rateCheck.resetInSec} ثانية متبقية). يرجى التمهل.` },
        { status: 429 }
      );
    }

    const { message, imageBase64, chatHistory, customKeys } = await req.json();

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
7. لديك وصول لقاعدة بيانات خبراء الصيانة المتخصصين. عند وجود بيانات مرجعية من قاعدة الخبرات في الرسالة، استخدمها كمرجع أول وادمج أكواد المكونات (مثل PQ301, PU201) في إجابتك.`;

    // استدعاء محرك الذكاء الاصطناعي مع التدوير التلقائي لكافة المفاتيح والمفاتيح الممررة من العميل
    const aiResponse = await callAIEngine({
      prompt: contextPrompt + message + expertContext,
      specialty: 'mobile-repair',
      deviceModel: 'General',
      readings: {},
      imageBase64: imageBase64 || undefined,
      preferredEngine: 'gemini',
      systemPrompt,
      skipEnhancement: true,
      customKeys,
    });

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
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'فشل في معالجة طلب المحادثة' },
      { status: 500 }
    );
  }
}
