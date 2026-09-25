import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { DAHAB_SYSTEM_PROMPT } from './promptTemplates';
import { DiagnosticMetrics, DeviceSpecialty, PowerSupplyReadings } from './types';
import { enhanceArabicPrompt } from './middleEastFeatures';
import { getAllActiveKeys } from './apiKeysStorage';

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
  modelUsed?: string;
  errorLog?: string[];
}

/**
 * تحليل وتقسيم المفاتيح المدخلة (تدعم مفتاح واحد أو عدة مفاتيح مفصولة بفواصل)
 */
export function parseApiKeys(envVar: string | undefined): string[] {
  if (!envVar) return [];
  return envVar
    .split(/[\n,;]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 5);
}

/**
 * جلب قائمة المحركات وحالتها
 */
export function getAvailableEngines(): AIEngineConfig[] {
  const geminiKeys = parseApiKeys(process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS || process.env.GOOGLE_API_KEY);
  const openrouterKeys = parseApiKeys(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEYS);
  const openaiKeys = parseApiKeys(process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEYS);

  return [
    {
      id: 'gemini',
      name: 'Google Gemini',
      model: 'gemini-2.0-flash / 1.5-flash',
      apiKey: geminiKeys[0] || '',
      enabled: geminiKeys.length > 0,
      priority: 1,
    },
    {
      id: 'openrouter',
      name: 'OpenRouter (Llama & DeepSeek & Gemini)',
      model: 'Llama 3.3 / Gemini / DeepSeek',
      apiKey: openrouterKeys[0] || '',
      enabled: openrouterKeys.length > 0,
      priority: 2,
    },
    {
      id: 'openai',
      name: 'OpenAI GPT-4o-mini',
      model: 'gpt-4o-mini / gpt-4o',
      apiKey: openaiKeys[0] || '',
      enabled: openaiKeys.length > 0,
      priority: 3,
    },
    {
      id: 'local',
      name: 'المحرك الهندسي المحلي',
      model: 'Dahab-Local-v3',
      apiKey: '',
      enabled: true,
      priority: 99,
    },
  ];
}

/**
 * استخراج الميتريكس الهندسية من النص
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
 * استدعاء Google Gemini مع تجربة عدة موديلات ومفاتيح
 */
async function tryCallGemini(
  apiKey: string,
  params: { prompt: string; imageBase64?: string; systemPrompt?: string }
): Promise<AIResponse> {
  const modelsToTry = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.5-flash',
  ];

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
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
      const text = result.response.text();
      if (text && text.trim().length > 0) {
        return {
          text,
          metrics: extractMetrics(text),
          engine: 'gemini',
          modelUsed: modelName,
        };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini (${modelName}) failed with key ending in ...${apiKey.slice(-5)}:`, err?.message || err);
      // إذا كان الخطأ متعلق بالموديل، نجرب الموديل التالي
      continue;
    }
  }

  throw lastError || new Error('فشلت جميع موديلات Gemini لهذا المفتاح');
}

/**
 * استدعاء OpenRouter مع موديلات ذكية ومتنوعة
 */
async function tryCallOpenRouter(
  apiKey: string,
  params: { prompt: string; imageBase64?: string; systemPrompt?: string }
): Promise<AIResponse> {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://dahab-device-doctor.vercel.app',
      'X-Title': 'Dahab Device Doctor',
    },
  });

  const modelsToTry = [
    'meta-llama/llama-3.3-70b-instruct',
    'deepseek/deepseek-chat',
    'google/gemini-2.0-flash-001',
    'google/gemini-2.0-flash-lite-001',
    'openai/gpt-4o-mini',
    'openrouter/auto',
  ];

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

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        max_tokens: 3000,
      });

      const text = response.choices[0]?.message?.content || '';
      if (text.trim().length > 0) {
        return {
          text,
          metrics: extractMetrics(text),
          engine: 'openrouter',
          modelUsed: model,
        };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`OpenRouter (${model}) failed:`, err?.message || err);
      continue;
    }
  }

  throw lastError || new Error('فشلت استجابة OpenRouter');
}

/**
 * استدعاء OpenAI مع تجربة gpt-4o-mini و gpt-4o
 */
async function tryCallOpenAI(
  apiKey: string,
  params: { prompt: string; imageBase64?: string; systemPrompt?: string }
): Promise<AIResponse> {
  const client = new OpenAI({ apiKey });

  const modelsToTry = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

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

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        max_tokens: 3000,
      });

      const text = response.choices[0]?.message?.content || '';
      if (text.trim().length > 0) {
        return {
          text,
          metrics: extractMetrics(text),
          engine: 'openai',
          modelUsed: model,
        };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`OpenAI (${model}) failed:`, err?.message || err);
      continue;
    }
  }

  throw lastError || new Error('فشلت استجابة OpenAI');
}

/**
 * محرك تشخيص هندسي محلي عالي الذكاء (Fallback عند انقطاع السحابة بالكامل)
 */
function generateSmartLocalResponse(params: {
  prompt: string;
  specialty?: DeviceSpecialty;
  deviceModel?: string;
  readings?: PowerSupplyReadings;
  systemPrompt?: string;
  errorsLog?: string[];
}): AIResponse {
  const { prompt, specialty = 'mobile-repair', deviceModel, readings, systemPrompt, errorsLog } = params;
  const pLower = prompt.toLowerCase();

  // فحص مؤشرات الهاردوير مقابل السوفتوير
  let isHw = false;
  let isSw = false;
  let hwProb = 50;
  let swProb = 50;
  let suspect = 'دائرة الباور أو الإقلاع';
  let action = 'فحص سحب التيار وممانعة مسارات التغذية الرئيسية';

  const hasShort =
    readings?.shortDetected ||
    (readings?.currentBeforePower !== undefined && readings.currentBeforePower > 0.05) ||
    pLower.includes('شورت') ||
    pLower.includes('short') ||
    pLower.includes('سخونة') ||
    pLower.includes('قصر') ||
    pLower.includes('يسخن');

  const hasBootloop =
    pLower.includes('لوجو') ||
    pLower.includes('ريستارت') ||
    pLower.includes('bootloop') ||
    pLower.includes('تفليش') ||
    pLower.includes('شاشة زرقاء') ||
    pLower.includes('فاست بوت') ||
    pLower.includes('يرستر');

  const hasPowerFailure =
    pLower.includes('فاصل باور') ||
    pLower.includes('لا يعمل') ||
    pLower.includes('dead') ||
    readings?.currentAfterPower === '0.00A' ||
    pLower.includes('قاطع');

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

  // إذا كان الطلب من شات المحادثة العادي
  if (systemPrompt && systemPrompt.includes('مساعد محادثة')) {
    let chatAnswer = '';
    if (pLower.includes('مرحبا') || pLower.includes('أهلا') || pLower.includes('سلام') || pLower.includes('علا')) {
      chatAnswer = `أهلاً بك يا باشمهندس! معك المساعد الذكي لمنظومة دهب لصيانة الإلكترونيات.
أنا جاهز لمساعدتك في فحص أي عطل، أو قراءة ممانعات الدايود مود، أو تحليل سحب الباور سبلاي، أو فحص سجلات البانيك وبدائل الآيسيهات.
ما هو الجهاز أو العطل الذي تعمل عليه الآن؟`;
    } else if (hasShort) {
      chatAnswer = `بناءً على وصفك لوجود شورت:
1. اعزل البوردة تماماً عن الشاشة والكاميرات.
2. ضع الملتيميتر على وضع الدايود (المجس الأحمر على الأرضي GND والأسود على خط التغذية الرئيسي VDD_MAIN أو VPH_PWR).
3. إذا أعطى صفارة أو قراءة تحت 0.015V، قم بتبخير البوردة بالرجينة (Rosin) ثم احقن فولت آمن 1.2V إلى 1.5V وتيار 2A لمراقبة المكثف المنصهر.`;
    } else if (hasBootloop) {
      chatAnswer = `في حالات الريستارت المتكرر (Bootloop):
1. افحص سحب التيار على الباور سبلاي، إذا كان السحب طبيعياً ويتكرر بشكل دوري، فالعطل سوفتوير أو حساس من حساسات الـ I2C (مثل فلاتة الشحن Prs0 أو زر الباور Mic2).
2. وصل الجهاز بالحاسوب وراقب تعرف Device Manager (وضع EDL 9008 أو DFU أو Fastboot).
3. إذا كان آيفون، افحص سجل البانيك (Panic-full) في تبويب محلل البانيك المخصص لكشف الحساس التالف فوراً.`;
    } else {
      chatAnswer = `تم استلام استفسارك بخصوص: "${prompt}".
لتقديم أفضل تشخيص هندسي:
- اذكر طراز الجهاز بالتحديد ورقم البوردة.
- اذكر سحب التيار على الباور سبلاي (قبل الضغط على زر الباور وبعده).
- اذكر قراءة الممانعة على خطوط التغذية الرئيسية بوضع الدايود.`;
    }

    // إضافة تقرير توضيحي شفاف للمهندس عن حالة المفاتيح
    let keyNotes = '';
    if (errorsLog && errorsLog.length > 0) {
      keyNotes = `\n\n*(تنبيه فني للمشرف: تم استخدام المحرك الهندسي الاحتياطي لتعذر الاتصال بالسحابة: ${errorsLog.slice(0, 2).join(' | ')})*`;
    }

    return {
      text: chatAnswer + keyNotes,
      metrics,
      engine: 'local',
      modelUsed: 'local-expert-v3',
    };
  }

  // التقرير الفني الشامل
  const text = `<<<DAHAB_DIAGNOSTIC_METRICS>>>
${JSON.stringify(metrics, null, 2)}
<<<END_DAHAB_METRICS>>>

### 1. 🔍 التشريح الأولي وتصنيف العطل (هاردوير vs سوفتوير)
- **التصنيف المعتمد:** ${classification === 'HARDWARE' ? 'عطل هاردوير قاطع (Hardware Component Failure)' : classification === 'SOFTWARE' ? 'عطل سوفتوير / فريموير (Software/Firmware Failure)' : 'عطل هجين محتمل (Hybrid Hardware/Software)'}
- **نسبة الاحتمال:** هاردوير **${hwProb}%** | سوفتوير **${swProb}%**
- **المكون المشتبه به الرئيسي:** ${suspect}

### 2. ⚡ تحليل سحب الباور سبلاي والقياسات (Current & Impedance Analysis)
- **قراءة السحب قبل التشغيل:** ${readings?.currentBeforePower !== undefined ? `${readings.currentBeforePower}A` : 'لم يتم تسجيل سحب مسبق'}. ${hasShort ? '⚠️ هذا السحب يؤكد وجود شورت صريح للأرضي.' : 'سحب طبيعي قبل الضغط.'}
- **سلوك الجهاز بعد الضغط على مفتاح الباور:** ${readings?.currentAfterPower || 'غير محدد بدقة'}.
- **الفحص بوضع الدايود (Diode Mode):**
  1. ضع المجس الأحمر للملتيميتر على الأرضي (GND) والأسود على المسار المعني.
  2. القراءة السليمة لخطوط التغذية تتراوح بين **0.280V إلى 0.450V**.

### 3. 🛠️ خطة التتبع والفحص خطوة بخطوة (Step-by-Step Test Points)
1. **الخطوة الأولى:** عزل البوردة عن الملحقات وفحص وجود سخونة موضعية.
2. **الخطوة الثانية:** ${action}.
3. **الخطوة الثالثة:** فحص خطوط الاتصال I2C (SCL / SDA) ومقاومات الرفع 2.2KΩ.

### 4. ⚠️ تحذيرات هندسية وبدائل القطع (IC Cross-Reference & Safety)
- ⚠️ **تحذير الأمان:** تجنب رفع فولت الحقن فوق الجهد الاسمي للمسار (خاصة مسارات المعالج Core 0.9V).
- 💡 **بدائل القطع:** راجع تبويب موسوعة بدائل الآيسيهات لمطابقة أرقام القطع المتوافقة قبل الرفع والتركيب.`;

  return { text, metrics, engine: 'local', modelUsed: 'local-expert-v3' };
}

/**
 * الوظيفة الرئيسية الشاملة لاستدعاء الذكاء الاصطناعي (Robust Multi-Provider Fallback)
 * تفحص جميع المفاتيح والمزودين بالتسلسل دون توقف أو استسلام
 */
export async function callAIEngine(params: {
  prompt: string;
  specialty?: DeviceSpecialty;
  deviceModel?: string;
  readings?: PowerSupplyReadings;
  imageBase64?: string;
  preferredEngine?: AIEngine;
  systemPrompt?: string;
  skipEnhancement?: boolean;
  customKeys?: {
    gemini?: string | string[];
    openrouter?: string | string[];
    openai?: string | string[];
    groq?: string | string[];
  };
}): Promise<AIResponse> {
  const { specialty = 'mobile-repair', systemPrompt = DAHAB_SYSTEM_PROMPT, skipEnhancement = false } = params;

  const enhancedPrompt = skipEnhancement ? params.prompt : enhanceArabicPrompt(params.prompt);
  const payload = {
    prompt: enhancedPrompt,
    imageBase64: params.imageBase64,
    systemPrompt,
  };

  const errorsLog: string[] = [];

  // جمع كافة المفاتيح المتاحة من لوحة التحكم /admin والمتصفح ومتغيرات البيئة
  const activeKeys = getAllActiveKeys(params.customKeys);
  const geminiKeys = activeKeys.geminiKeys;
  const openrouterKeys = activeKeys.openrouterKeys;
  const openaiKeys = activeKeys.openaiKeys;

  console.log(`=== Active AI Keys: Gemini (${geminiKeys.length}), OpenRouter (${openrouterKeys.length}), OpenAI (${openaiKeys.length}) ===`);

  // تحديد ترتيب المزودين بناءً على التفضيل أو الأفضلية
  // نضع Gemini و OpenRouter أولاً لأن لهما حصص مجانية وفيرة وموديلات متعددة
  const providerOrder: AIEngine[] = [];
  if (params.preferredEngine && params.preferredEngine !== 'local') {
    providerOrder.push(params.preferredEngine);
  }
  ['gemini', 'openrouter', 'openai'].forEach((p) => {
    if (!providerOrder.includes(p as AIEngine)) {
      providerOrder.push(p as AIEngine);
    }
  });

  // تجربة المزودين حسب الترتيب
  for (const provider of providerOrder) {
    if (provider === 'gemini' && geminiKeys.length > 0) {
      for (let i = 0; i < geminiKeys.length; i++) {
        const key = geminiKeys[i];
        try {
          console.log(`Attempting Gemini (Key #${i + 1})...`);
          const res = await tryCallGemini(key, payload);
          console.log(`✅ Gemini succeeded with model ${res.modelUsed}`);
          return res;
        } catch (err: any) {
          const errMsg = `Gemini (Key #${i + 1}): ${err?.message || err}`;
          console.error(errMsg);
          errorsLog.push(errMsg);
        }
      }
    }

    if (provider === 'openrouter' && openrouterKeys.length > 0) {
      for (let i = 0; i < openrouterKeys.length; i++) {
        const key = openrouterKeys[i];
        try {
          console.log(`Attempting OpenRouter (Key #${i + 1})...`);
          const res = await tryCallOpenRouter(key, payload);
          console.log(`✅ OpenRouter succeeded with model ${res.modelUsed}`);
          return res;
        } catch (err: any) {
          const errMsg = `OpenRouter (Key #${i + 1}): ${err?.message || err}`;
          console.error(errMsg);
          errorsLog.push(errMsg);
        }
      }
    }

    if (provider === 'openai' && openaiKeys.length > 0) {
      for (let i = 0; i < openaiKeys.length; i++) {
        const key = openaiKeys[i];
        try {
          console.log(`Attempting OpenAI (Key #${i + 1})...`);
          const res = await tryCallOpenAI(key, payload);
          console.log(`✅ OpenAI succeeded with model ${res.modelUsed}`);
          return res;
        } catch (err: any) {
          const errMsg = `OpenAI (Key #${i + 1}): ${err?.message || err}`;
          console.error(errMsg);
          errorsLog.push(errMsg);
        }
      }
    }
  }

  // إذا فشلت كافة المفاتيح السحابية، نعود للمحرك المحلي الذكي مع تمرير سجل الأخطاء الشفاف
  console.warn('All cloud AI keys failed. Falling back to Smart Local Engine. Errors:', errorsLog);
  const localRes = generateSmartLocalResponse({
    prompt: params.prompt,
    specialty,
    deviceModel: params.deviceModel,
    readings: params.readings,
    systemPrompt,
    errorsLog,
  });

  localRes.errorLog = errorsLog;
  return localRes;
}

/**
 * إنشاء تدفق البث الحي (Streaming Response)
 */
export function createStreamingResponse(text: string): ReadableStream {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const words = text.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(' ') + ' ';
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 16));
      }
      controller.close();
    },
  });
  return stream;
}
