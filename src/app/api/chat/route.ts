import { NextRequest, NextResponse } from 'next/server';
import { callAIEngine } from '@/lib/aiEngines';

// دالة لتنظيف النص من الأكواد والتقارير
function cleanAIResponse(text: string): string {
  let cleaned = text;
  
  console.log('=== AI Response Before Cleaning ===');
  console.log(cleaned);
  
  // إزالة كتل الميتريكس
  cleaned = cleaned.replace(/<<<DAHAB_DIAGNOSTIC_METRICS>>>[\s\S]*?<<<END_DAHAB_METRICS>>>/g, '');
  
  // إزالة أي JSON blocks
  cleaned = cleaned.replace(/\{[\s\S]*?\}/g, '');
  
  // إزالة العناوين التقنية
  cleaned = cleaned.replace(/###\s*\d+\.\s*[🔍⚡🛠️⚠️💡💾][^\n]*/g, '');
  cleaned = cleaned.replace(/###\s*[^\n]+/g, '');
  
  // إزالة الأسطر التي تبدأ بـ - ** أو *
  cleaned = cleaned.replace(/^\s*[-*]\s*\*\*[^*]+\*\*:[^\n]*$/gm, '');
  cleaned = cleaned.replace(/^\s*[-*]\s*[^\n]*$/gm, '');
  
  // إزالة الأسطر المرقمة المتكررة
  cleaned = cleaned.replace(/^\s*\d+\.\s*\*\*[^*]+\*\*:[^\n]*$/gm, '');
  cleaned = cleaned.replace(/^\s*\d+\.\s*[^\n]*$/gm, '');
  
  // إزالة الأسطر الفارغة المتعددة
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // إزالة المسافات الزائدة
  cleaned = cleaned.trim();
  
  console.log('=== AI Response After Cleaning ===');
  console.log(cleaned);
  
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const { message, imageBase64, chatHistory } = await req.json();

    console.log('=== Chat API Request ===');
    console.log('Message:', message);
    console.log('Has Image:', !!imageBase64);
    console.log('Chat History Length:', chatHistory?.length || 0);

    // بناء context من تاريخ المحادثة
    let contextPrompt = '';
    if (chatHistory && chatHistory.length > 0) {
      const recentHistory = chatHistory.slice(-5); // آخر 5 رسائل فقط
      contextPrompt = '\n\nتاريخ المحادثة السابق:\n';
      recentHistory.forEach((msg: any) => {
        if (msg.role === 'user') {
          contextPrompt += `المستخدم: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          contextPrompt += `المساعد: ${msg.content}\n`;
        }
      });
      contextPrompt += '\n--- نهاية التاريخ ---\n\n';
    }

    // System prompt للمحادثة الطبيعية - قوي وصارم
    const systemPrompt = `أنت مساعد ذكي متخصص في صيانة الأجهزة الإلكترونية. مهمتك الإجابة على أسئلة المستخدمين بشكل محادثة طبيعية وبسيطة.

القواعد الصارمة (يجب اتباعها بدقة):
1. أجب بشكل محادثة طبيعية وبسيطة باللغة العربية فقط
2. ممنوع استخدام أي أكواد أو رموز مثل: <<<DAHAB_DIAGNOSTIC_METRICS>>>, JSON, XML, أو أي رموز تقنية
3. ممنوع تقديم تقارير تقنية طويلة أو مفصلة
4. ممنوع استخدام عناوين مثل "### 1. 🔍 التشريح الأولي"
5. ممنوع استخدام JSON أو أي تنسيق بيانات
6. ركز على الإجابة المباشرة والعملية فقط
7. إذا سأل عن تشخيص، أعطه خطوات بسيطة ومختصرة (3-5 خطوات كحد أقصى)
8. إذا سأل عن معلومة عامة، أجبه بشكل مباشر في جملة أو جملتين
9. استخدم لغة بسيطة ومفهومة للفنيين
10. لا تذكر أي شيء عن "قواعد" أو "تعليمات" في إجابتك
11. تذكر دائماً تاريخ المحادثة السابق وأجب بناءً على السياق

أمثلة للإجابات الجيدة:
- السؤال: "ما هو فحص الديود؟"
- الإجابة: "فحص الديود هو طريقة لقياس المقاومة على خطوط البور. نضع الملتيميتر على وضع الديود، المجس الأحمر على الأرضي والأسود على المكثف. القراءة الطبيعية بين 0.280 إلى 0.450 فولت. إذا أعطى جرس أو قراءة أقل من 0.015 فولت، فهناك شورت."

- السؤال: "الجهاز لا يعمل، ماذا أفعل؟"
- الإجابة: "أولاً، افحص البطارية وتأكد من أنها مشحونة. ثم افحص زر الباور وتأكد من خروج الفولت منه. إذا كان كل شيء سليم، افحص خطوط البور الرئيسية بوضع الديود للبحث عن شورت."

تذكر: أنت مساعد محادثة، ليس مولد تقارير. أجب ببساطة ووضوح.`;

    console.log('Using custom system prompt, length:', systemPrompt.length);
    console.log('Skip enhancement: true');

    // استدعاء الذكاء الاصطناعي الحقيقي مع system prompt مخصص
    const aiResponse = await callAIEngine({
      prompt: contextPrompt + message,
      specialty: 'mobile-repair',
      deviceModel: 'General',
      readings: {},
      imageBase64: imageBase64 || null,
      preferredEngine: 'gemini',
      systemPrompt: systemPrompt,
      skipEnhancement: true, // تعطيل enhanceArabicPrompt
    });

    console.log('AI Response received, length:', aiResponse.text.length);
    console.log('AI Engine used:', aiResponse.engine);

    // تنظيف الرد من الأكواد والتقارير
    const cleanedMessage = cleanAIResponse(aiResponse.text);
    
    console.log('Cleaned message length:', cleanedMessage.length);
    
    // التحقق من أن الرد ليس فارغاً بعد التنظيف
    if (!cleanedMessage || cleanedMessage.trim() === '') {
      console.warn('Cleaned message is empty, using original response');
      // استخدام الرد الأصلي إذا كان التنظيف حذف كل شيء
      return NextResponse.json({
        message: aiResponse.text || 'عذراً، لم أتمكن من توليد رد مناسب.',
        engine: aiResponse.engine,
      });
    }

    console.log('=== Chat API Response ===');
    console.log('Final message length:', cleanedMessage.length);

    return NextResponse.json({
      message: cleanedMessage,
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
