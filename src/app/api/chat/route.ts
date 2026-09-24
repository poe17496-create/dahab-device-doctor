import { NextRequest, NextResponse } from 'next/server';
import { callAIEngine } from '@/lib/aiEngines';

export async function POST(req: NextRequest) {
  try {
    const { message, imageBase64 } = await req.json();

    // System prompt للمحادثة الطبيعية
    const systemPrompt = `أنت مساعد ذكي متخصص في صيانة الأجهزة الإلكترونية. مهمتك الإجابة على أسئلة المستخدمين بشكل محادثة طبيعية وبسيطة.

القواعد:
1. أجب بشكل محادثة طبيعية وبسيطة باللغة العربية
2. لا تستخدم أكواد أو رموز مثل <<<DAHAB_DIAGNOSTIC_METRICS>>>
3. لا تقدم تقارير تقنية طويلة ومفصلة
4. ركز على الإجابة المباشرة والعملية
5. إذا سأل عن تشخيص، أعطه خطوات بسيطة ومختصرة
6. إذا سأل عن معلومة عامة، أجبه بشكل مباشر
7. استخدم لغة بسيطة ومفهومة للفنيين

مثال للإجابة الجيدة:
- السؤال: "ما هو فحص الديود؟"
- الإجابة: "فحص الديود هو طريقة لقياس المقاومة على خطوط البور. نضع الملتيميتر على وضع الديود، المجس الأحمر على الأرضي والأسود على المكثف. القراءة الطبيعية بين 0.280 إلى 0.450 فولت. إذا أعطى جرس أو قراءة أقل من 0.015 فولت، فهناك شورت."`;

    // استدعاء الذكاء الاصطناعي الحقيقي
    const aiResponse = await callAIEngine({
      prompt: `${systemPrompt}\n\nسؤال المستخدم: ${message}`,
      specialty: 'mobile-repair',
      deviceModel: 'General',
      readings: {},
      imageBase64: imageBase64 || null,
      preferredEngine: 'gemini',
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
