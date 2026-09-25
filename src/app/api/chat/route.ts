import { NextRequest, NextResponse } from 'next/server';
import { callAIEngine } from '@/lib/aiEngines';

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
    const { message, imageBase64, chatHistory, customKeys } = await req.json();

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

    // System prompt للمساعد الذكي
    const systemPrompt = `أنت كبير مهندسي وفنيي الإلكترونيات ومستشار الصيانة الذكي في منظومة "دهب دكتور" (Dahab Device Doctor).
مهمتك مساعدة فنيي الصيانة ومهندسي الإلكترونيات في تشخيص أعطال الموبايل، واللابتوب، والماك بوك، وكروت الباور بدقة واحترافية وبأسلوب محادثة عملي وتفاعلي.

قواعدك الأساسية:
1. تحدث باللغة العربية بأسلوب محادثة راقٍ ومباشر وسهل الفهم لمهندسي وفنيي الورش.
2. استخدم المصطلحات الهندسية الدقيقة (مثل: Diode Mode, VDD_MAIN, VPH_PWR, BUCK Coils, Rosin Smoke, Short to GND, Bootloop, DFU, EDL 9008).
3. عند السؤال عن عطل، قدم خطوات الفحص المنطقية بالترتيب (1، 2، 3) مع تحديد الفولتات والممانعات النموذجية.
4. اذكر دائماً نصائح الأمان (مثل: عدم رفع فولت الحقن لتفادي احتراق المعالجات).
5. تذكر سياق الحوار السابق وأجب بذكاء وترابط، وإذا كان استفساراً عاماً أو تحية، رحب بالفني بحرارة وسله عن الجهاز أو البوردة التي يعمل عليها.`;

    // استدعاء محرك الذكاء الاصطناعي مع التدوير التلقائي لكافة المفاتيح والمفاتيح الممررة من العميل
    const aiResponse = await callAIEngine({
      prompt: contextPrompt + message,
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
