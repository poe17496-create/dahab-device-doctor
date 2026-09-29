import { NextRequest, NextResponse } from 'next/server';
import { callAIEngine } from '@/lib/aiEngines';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { deviceModel, fileContent, imageBase64, customKeys } = await req.json();

    if (!fileContent && !imageBase64 && !deviceModel) {
      return NextResponse.json({ error: 'يرجى تقديم محتوى المخطط أو صورة البلوك دياجرام' }, { status: 400 });
    }

    const systemPrompt = `أنت مهندس متخصص في فحص وتشريح المخططات الهندسية (Schematic Diagrams) والبورد فيو.
مهمتك استخراج البيانات الهندسية بدقة متناهية من نصوص أو صور المخططات وتحويلها إلى كود JSON تركيبي منظم.

يجب أن تعيد الإجابة فقط بتنسيق JSON المعياري التالي:
{
  "deviceModel": "اسم الجهاز",
  "boardCode": "كود المازربورد (Part Number)",
  "category": "mobile" | "laptop" | "desktop",
  "powerSequence": [
    "1. VDD_MAIN / 19V DC-IN (تغذية الدخل الأولية)",
    "2. Always-On Rails (+3VALW / +5VALW)",
    "3. S5 to S3 Sleep State Transition (PM_SLP_S4# / SLP_S3#)",
    "4. Core Voltage Generation (VCORE / GPU / RAM)"
  ],
  "powerRails": [
    { "rail": "اسم الخط", "voltage": "الجهد (مثلاً 3.3V)", "diodeMode": "الممانعة الطبيعية بالملتيميتر", "safeInjection": "فولت الحقن الآمن" }
  ],
  "keyICs": [
    { "designator": "رقم القطعة (مثلاً PU100 / U3100)", "partNumber": "كود الآيسي (مثلاً BQ24780)", "role": "الوظيفة", "commonFailure": "العطل الشائع" }
  ],
  "testPoints": [
    { "point": "اسم نقطة الفحص أو المقاومة", "expectedValue": "القيمة السليمة", "notes": "ملاحظات الفحص" }
  ]
}`;

    const userPrompt = `قم بتشريح المخطط الهندسي التالي واستخراج المسارات ونقاط الفحص والآيسيات بدقة:
طراز الجهاز: ${deviceModel || 'غير محدد'}
محتوى نصوص المخطط:
${fileContent || 'يرجى استخراج البيانات من صورة المخطط المرفقة'}

أعد كود JSON فقط بدون أي مقدمات أو شروحات إضافية.`;

    const aiRes = await callAIEngine({
      systemPrompt,
      prompt: userPrompt,
      imageBase64: imageBase64 || undefined,
      customKeys,
    });

    const rawText = aiRes.text || '';
    let parsedData = null;

    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse AI schematic JSON, returning raw text');
    }

    return NextResponse.json({
      success: true,
      data: parsedData,
      rawAnalysis: rawText,
    });
  } catch (error: any) {
    console.error('Schematic PDF analyze API error:', error);
    return NextResponse.json({ error: error.message || 'فشل في تشريح المخطط الهندسي' }, { status: 500 });
  }
}
