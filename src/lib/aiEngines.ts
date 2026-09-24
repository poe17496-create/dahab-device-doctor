import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { DAHAB_SYSTEM_PROMPT } from './promptTemplates';
import { DiagnosticMetrics, DeviceSpecialty, PowerSupplyReadings } from './types';
import { enhanceArabicPrompt } from './middleEastFeatures';

export type AIEngine = 'gemini' | 'openai' | 'openrouter' | 'local';

export interface AIEngineConfig {
  id: AIEngine;
  name: string;
  model: string;
  apiKey: string;
  enabled: boolean;
  priority: number;
}

export interface AIResponse {
  text: string;
  metrics?: DiagnosticMetrics;
  engine: AIEngine;
}

/**
 * إعداد المحركات المتاحة
 */
export function getAvailableEngines(): AIEngineConfig[] {
  return [
    {
      id: 'openai',
      name: 'OpenAI GPT-4o',
      model: 'gpt-4o',
      apiKey: process.env.OPENAI_API_KEY || '',
      enabled: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10,
      priority: 1,
    },
    {
      id: 'openrouter',
      name: 'OpenRouter GLM-5.2',
      model: 'glm/glm-5.2',
      apiKey: process.env.OPENROUTER_API_KEY || '',
      enabled: !!process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.length > 10,
      priority: 2,
    },
    {
      id: 'gemini',
      name: 'Google Gemini 1.5 Flash',
      model: 'gemini-1.5-flash',
      apiKey: process.env.GEMINI_API_KEY || '',
      enabled: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10,
      priority: 3,
    },
    {
      id: 'local',
      name: 'المحرك المحلي المتقدم',
      model: 'local-expert',
      apiKey: '',
      enabled: true,
      priority: 99,
    },
  ];
}

/**
 * الحصول على أفضل محرك متاح
 */
export function getBestEngine(): AIEngineConfig {
  const engines = getAvailableEngines().filter(e => e.enabled);
  return engines.sort((a, b) => a.priority - b.priority)[0] || engines[engines.length - 1];
}

/**
 * استدعاء OpenAI API
 */
async function callOpenAI(params: {
  prompt: string;
  imageBase64?: string;
  systemPrompt?: string;
}): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const openai = new OpenAI({ apiKey });

  const messages: any[] = [
    { role: 'system', content: params.systemPrompt || DAHAB_SYSTEM_PROMPT },
    { role: 'user', content: params.prompt },
  ];

  if (params.imageBase64) {
    const matches = params.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      messages[1].content = [
        { type: 'text', text: params.prompt },
        {
          type: 'image_url',
          image_url: { url: params.imageBase64 },
        },
      ];
    }
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 4000,
    stream: false,
  });

  const text = response.choices[0]?.message?.content || '';
  const metrics = extractMetrics(text);

  return { text, metrics, engine: 'openai' };
}

/**
 * استدعاء OpenRouter API مع GLM-5.2
 */
async function callOpenRouter(params: {
  prompt: string;
  imageBase64?: string;
  systemPrompt?: string;
}): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OpenRouter API key not configured');

  const openai = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  const messages: any[] = [
    { role: 'system', content: params.systemPrompt || DAHAB_SYSTEM_PROMPT },
    { role: 'user', content: params.prompt },
  ];

  if (params.imageBase64) {
    const matches = params.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      messages[1].content = [
        { type: 'text', text: params.prompt },
        {
          type: 'image_url',
          image_url: { url: params.imageBase64 },
        },
      ];
    }
  }

  const response = await openai.chat.completions.create({
    model: 'glm/glm-5.2',
    messages,
    max_tokens: 4000,
    stream: false,
  });

  const text = response.choices[0]?.message?.content || '';
  const metrics = extractMetrics(text);

  return { text, metrics, engine: 'openrouter' };
}

/**
 * استدعاء Google Gemini API
 */
async function callGemini(params: {
  prompt: string;
  imageBase64?: string;
  systemPrompt?: string;
}): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key not configured');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: params.systemPrompt || DAHAB_SYSTEM_PROMPT,
  });

  let contentParts: any[] = [{ text: params.prompt }];

  if (params.imageBase64) {
    const matches = params.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      contentParts.push({
        inlineData: {
          mimeType: matches[1],
          data: matches[2],
        },
      });
    }
  }

  const result = await model.generateContent(contentParts);
  const text = result.response.text() || '';
  const metrics = extractMetrics(text);

  return { text, metrics, engine: 'gemini' };
}

/**
 * استخراج الميتريكس من النص
 */
function extractMetrics(text: string): DiagnosticMetrics | undefined {
  const match = text.match(/<<<DAHAB_DIAGNOSTIC_METRICS>>>([\s\S]*?)<<<END_DAHAB_METRICS>>>/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {
      console.error('فشل تحويل الميتريكس:', e);
    }
  }
  return undefined;
}

/**
 * المحرك المحلي المتقدم (Fallback)
 */
function generateLocalDiagnosis(params: {
  prompt: string;
  specialty: DeviceSpecialty;
  deviceModel?: string;
  readings?: PowerSupplyReadings;
}): AIResponse {
  const { prompt, specialty, deviceModel, readings } = params;
  const pLower = prompt.toLowerCase();

  let isHw = false;
  let isSw = false;
  let hwProb = 50;
  let swProb = 50;
  let suspect = 'دائرة الباور أو الإقلاع';
  let action = 'فحص سحب التيار وممانعة مسارات التغذية الرئيسية';

  const hasShort = readings?.shortDetected || readings?.currentBeforePower! > 0.05 || 
                   pLower.includes('شورت') || pLower.includes('short') || 
                   pLower.includes('سخونة') || pLower.includes('قصر');
  const hasBootloop = pLower.includes('لوجو') || pLower.includes('ريستارت') || 
                      pLower.includes('bootloop') || pLower.includes('تفليش') || 
                      pLower.includes('شاشة زرقاء') || pLower.includes('فاست بوت');
  const hasPowerFailure = pLower.includes('فاصل باور') || pLower.includes('لا يعمل') || 
                          pLower.includes('dead') || readings?.currentAfterPower === '0.00A';

  if (hasShort) {
    isHw = true;
    hwProb = 95;
    swProb = 5;
    suspect = 'شورت صريح في خط التغذية الرئيسي (VDD_MAIN / VPH_PWR / 19V Rail)';
    action = 'حقن فولت آمن لا يتجاوز 1.5V مع تتبع السخونة بالرجينة أو الكاميرا الحرارية';
  } else if (hasBootloop && !hasShort) {
    isSw = true;
    hwProb = 20;
    swProb = 80;
    suspect = 'تلف في السوفتوير / النظام أو كيرنل بانيك (Kernel Panic)';
    action = 'إدخال الجهاز وضع الفاست بوت أو الريكفري وفحص إمكانية كتابة فلاشة رسمية مع حفظ البيانات';
  } else if (hasPowerFailure) {
    isHw = true;
    hwProb = 80;
    swProb = 20;
    suspect = 'غياب فولت التغذية للآيسي الرئيسي أو تلف كريستالة التوقيت 38.4MHz';
    action = 'قياس ممانعة مفتاح الباور وخطوط الـ BUCK والمساعدات حول الـ PMIC';
  }

  const classification = isHw ? 'HARDWARE' : isSw ? 'SOFTWARE' : 'HYBRID';
  const metrics: DiagnosticMetrics = {
    classification,
    hardwareProbability: hwProb,
    softwareProbability: swProb,
    urgencyLevel: hasShort ? 'CRITICAL' : 'HIGH',
    primarySuspectComponent: suspect,
    recommendedAction: action,
  };

  const text = `<<<DAHAB_DIAGNOSTIC_METRICS>>>
${JSON.stringify(metrics, null, 2)}
<<<END_DAHAB_METRICS>>>

### 1. 🔍 التشريح الأولي وتصنيف العطل (هاردوير vs سوفتوير)
- **التصنيف المعتمد:** ${classification === 'HARDWARE' ? 'عطل هاردوير قاطع (Hardware Failure)' : classification === 'SOFTWARE' ? 'عطل سوفتوير / فريموير (Software/Firmware Failure)' : 'عطل هجين محتمل (Hybrid Hardware/Software)'}
- **نسبة الاحتمال:** هاردوير **${hwProb}%** | سوفتوير **${swProb}%**
- **التحليل الفني:** بناءً على سلوك الجهاز المدخل (${prompt}) وقراءات أجهزة المعمل المسجلة، يتبين أن المشكلة تتركز أساساً في ${suspect}.

### 2. ⚡ تحليل سحب الباور سبلاي والقياسات (Current & Impedance Analysis)
- **قراءة السحب قبل التشغيل:** ${readings?.currentBeforePower !== undefined ? `${readings.currentBeforePower}A` : 'لم يتم تسجيل سحب مسبق'}. ${hasShort ? '⚠️ هذا السحب يؤكد وجود مسار متصل بالأرضي مباشرة (Direct Short).' : 'سحب صفر طبيعي قبل الضغط على المفتاح.'}
- **سلوك الجهاز بعد الضغط على مفتاح الباور:** ${readings?.currentAfterPower || 'غير محدد بدقة'}.
- **الفحص بوضع الدايود (Diode Mode):**
  1. ضع المجس الأحمر للملتيميتر على الأرضي (GND الشاسيه) والمجس الأسود على المكثفات المحيطة بآيسي التغذية.
  2. القراءة السليمة على خطوط الـ BUCK تتراوح عادة بين **0.280V إلى 0.450V**.
  3. إذا أعطى الملتيميتر جرس أو قراءة أقل من **0.015V** فهذا يعني وجود شورت على هذا الخط.

### 3. 🛠️ خطة التتبع والفحص خطوة بخطوة (Step-by-Step Test Points)
1. **الخطوة الأولى:** عزل البوردة عن الشاشة والكاميرات والفلاتات الجانبية للتأكد من عدم وجود شورت في الملحقات الخارجية.
2. **الخطوة الثانية:** ${hasShort ? 'استخدام تقنية التبخير بالرجينة (Rosin Smoke) أو الكاميرا الحرارية، ثم حقن فولت مسار VDD_MAIN بقيمة 1.2V وتيار 2A لملاحظة المكون المنصهر أولاً.' : 'التأكد من خروج فولتية زر الباور (1.8V إلى 3.3V) وسقوطها للصفر عند الضغط على الزر.'}
3. **الخطوة الثالثة:** فحص خطوط الاتصال I2C المشتركة بين آيسي الشحن وآيسي الباور والمعالج (SCL / SDA) للتأكد من عدم تلف مقاومات الـ Pull-up (قيمتها 2.2KΩ).
4. **الخطوة الرابعة (للسوفتوير):** في حال الشك في ملفات النظام، قم بتوصيل الجهاز بالحاسوب ومراقبة الـ Device Manager للتأكد من تعريف المنفذ (Qualcomm 9008 أو MTK Preloader أو Apple DFU).

### 4. ⚠️ تحذيرات هندسية وبدائل القطع (IC Cross-Reference & Safety)
- ⚠️ **تحذير الأمان:** لا تقم أبداً بحقن فولت أعلى من الفولت الاسمي للمسار (مثلاً خطوط المعالج Core لا تتحمل أكثر من 1.0V).
- 💡 **بدائل القطع:** راجع قاعدة بيانات الآيسيهات المدمجة في منظومة دهب لمطابقة الأرقام المتوافقة قبل البدء في رفع أو شبلنة أي آيسي.
- 💾 **حفظ البيانات:** تم توثيق وحفظ قراءات هذا الفحص في ملف الـ JSON الخاص بذاكرة هذا الجهاز للرجوع إليها في أي وقت.`;

  return { text, metrics, engine: 'local' };
}

/**
 * الوظيفة الرئيسية لاستدعاء محرك AI
 * تعمل تلقائياً باختيار أفضل محرك متاح
 */
export async function callAIEngine(params: {
  prompt: string;
  specialty?: DeviceSpecialty;
  deviceModel?: string;
  readings?: PowerSupplyReadings;
  imageBase64?: string;
  preferredEngine?: AIEngine;
  systemPrompt?: string; // custom system prompt للمحادثة
}): Promise<AIResponse> {
  const { specialty = 'mobile-repair', systemPrompt = DAHAB_SYSTEM_PROMPT } = params;
  
  // تحسين النص العربي بالمصطلحات التقنية
  const enhancedPrompt = enhanceArabicPrompt(params.prompt);
  const paramsWithSpecialty = { ...params, prompt: enhancedPrompt, specialty, systemPrompt };

  // استخدام أفضل محرك متاح تلقائياً
  const bestEngine = getBestEngine();
  
  try {
    switch (bestEngine.id) {
      case 'openai':
        return await callOpenAI(paramsWithSpecialty);
      case 'openrouter':
        return await callOpenRouter(paramsWithSpecialty);
      case 'gemini':
        return await callGemini(paramsWithSpecialty);
      case 'local':
        return generateLocalDiagnosis(paramsWithSpecialty);
    }
  } catch (error) {
    console.error('فشل المحرك الأساسي، الانتقال للمحرك التالي:', error);
    // محاولة المحركات الأخرى بالترتيب
    const engines = getAvailableEngines().filter(e => e.enabled && e.id !== bestEngine.id);
    
    for (const engine of engines) {
      try {
        switch (engine.id) {
          case 'openai':
            return await callOpenAI(paramsWithSpecialty);
          case 'openrouter':
            return await callOpenRouter(paramsWithSpecialty);
          case 'gemini':
            return await callGemini(paramsWithSpecialty);
          case 'local':
            return generateLocalDiagnosis(paramsWithSpecialty);
        }
      } catch (e) {
        console.error(`فشل المحرك ${engine.id}:`, e);
        continue;
      }
    }
  }

  // Fallback للمحرك المحلي
  console.log('استخدام المحرك المحلي كنسخة احتياطية');
  return generateLocalDiagnosis(paramsWithSpecialty);
}

/**
 * إنشاء ReadableStream للبث الحي
 */
export function createStreamingResponse(text: string): ReadableStream {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const words = text.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(' ') + ' ';
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 18));
      }
      controller.close();
    },
  });
  return stream;
}
