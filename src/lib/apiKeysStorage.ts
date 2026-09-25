import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export interface StoredApiKeys {
  geminiKeys: string[];
  openrouterKeys: string[];
  openaiKeys: string[];
  groqKeys: string[];
  updatedAt: string;
}

const BASE_DIR = process.env.VERCEL ? '/tmp' : process.cwd();
const DATA_DIR = path.join(BASE_DIR, 'data');
const KEYS_FILE = path.join(DATA_DIR, 'api_keys.json');

function ensureDirectories() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.error('Error ensuring data dir for keys:', e);
  }
}

/**
 * تحليل وتقسيم المفاتيح من نص أو مصفوفة
 */
export function parseKeysList(input: string | string[] | undefined): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((k) => k.trim()).filter((k) => k.length > 5);
  }
  return input
    .split(/[\n,;]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 5);
}

/**
 * قراءة المفاتيح المخزنة في ملف الـ JSON
 */
export function getStoredApiKeys(): StoredApiKeys {
  ensureDirectories();
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const content = fs.readFileSync(KEYS_FILE, 'utf-8');
      const data = JSON.parse(content);
      return {
        geminiKeys: parseKeysList(data.geminiKeys),
        openrouterKeys: parseKeysList(data.openrouterKeys),
        openaiKeys: parseKeysList(data.openaiKeys),
        groqKeys: parseKeysList(data.groqKeys),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error('Error reading stored API keys:', err);
  }

  // افتراضياً قراءة ما هو موجود في متغيرات البيئة
  return {
    geminiKeys: parseKeysList(process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS || process.env.GOOGLE_API_KEY),
    openrouterKeys: parseKeysList(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEYS),
    openaiKeys: parseKeysList(process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEYS),
    groqKeys: parseKeysList(process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * حفظ المفاتيح الجديدة في ملف JSON بالمعمل
 */
export function saveStoredApiKeys(keys: {
  geminiKeys?: string | string[];
  openrouterKeys?: string | string[];
  openaiKeys?: string | string[];
  groqKeys?: string | string[];
}): StoredApiKeys {
  ensureDirectories();
  const current = getStoredApiKeys();

  const updated: StoredApiKeys = {
    geminiKeys: keys.geminiKeys !== undefined ? parseKeysList(keys.geminiKeys) : current.geminiKeys,
    openrouterKeys: keys.openrouterKeys !== undefined ? parseKeysList(keys.openrouterKeys) : current.openrouterKeys,
    openaiKeys: keys.openaiKeys !== undefined ? parseKeysList(keys.openaiKeys) : current.openaiKeys,
    groqKeys: keys.groqKeys !== undefined ? parseKeysList(keys.groqKeys) : current.groqKeys,
    updatedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing stored API keys:', err);
  }

  return updated;
}

/**
 * جلب جميع المفاتيح النشطة مع دمج المفاتيح الممررة من العميل أو الملف أو البيئة
 */
export function getAllActiveKeys(customKeys?: {
  gemini?: string | string[];
  openrouter?: string | string[];
  openai?: string | string[];
  groq?: string | string[];
}): {
  geminiKeys: string[];
  openrouterKeys: string[];
  openaiKeys: string[];
  groqKeys: string[];
} {
  const stored = getStoredApiKeys();

  const gemini = [
    ...parseKeysList(customKeys?.gemini),
    ...stored.geminiKeys,
    ...parseKeysList(process.env.GEMINI_API_KEY),
    ...parseKeysList(process.env.GEMINI_API_KEYS),
    ...parseKeysList(process.env.GOOGLE_API_KEY),
  ];

  const openrouter = [
    ...parseKeysList(customKeys?.openrouter),
    ...stored.openrouterKeys,
    ...parseKeysList(process.env.OPENROUTER_API_KEY),
    ...parseKeysList(process.env.OPENROUTER_API_KEYS),
  ];

  const openai = [
    ...parseKeysList(customKeys?.openai),
    ...stored.openaiKeys,
    ...parseKeysList(process.env.OPENAI_API_KEY),
    ...parseKeysList(process.env.OPENAI_API_KEYS),
  ];

  const groq = [
    ...parseKeysList(customKeys?.groq),
    ...stored.groqKeys,
    ...parseKeysList(process.env.GROQ_API_KEY),
    ...parseKeysList(process.env.GROQ_API_KEYS),
  ];

  // إزالة التكرارات
  return {
    geminiKeys: Array.from(new Set(gemini)),
    openrouterKeys: Array.from(new Set(openrouter)),
    openaiKeys: Array.from(new Set(openai)),
    groqKeys: Array.from(new Set(groq)),
  };
}

/**
 * فحص واختبار مفتاح ذكاء اصطناعي بشكل حي ومباشر
 */
export async function testSingleApiKey(
  provider: 'gemini' | 'openrouter' | 'openai' | 'groq',
  key: string
): Promise<{
  success: boolean;
  message: string;
  latencyMs: number;
  modelUsed?: string;
  error?: string;
}> {
  const startTime = Date.now();
  if (!key || key.trim().length < 6) {
    return {
      success: false,
      message: 'المفتاح غير صالح أو قصير جداً',
      latencyMs: 0,
      error: 'Invalid key length',
    };
  }

  const cleanKey = key.trim();

  try {
    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(cleanKey);
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      let lastErr = null;

      for (const m of models) {
        try {
          const model = genAI.getGenerativeModel({ model: m });
          const res = await model.generateContent('Say OK in 1 word');
          const txt = res.response.text();
          const latencyMs = Date.now() - startTime;
          return {
            success: true,
            message: `متصل ويعمل بنجاح (الموديل: ${m})`,
            latencyMs,
            modelUsed: m,
          };
        } catch (e: any) {
          lastErr = e;
          continue;
        }
      }
      throw lastErr || new Error('فشل فحص موديلات Gemini');
    }

    if (provider === 'openrouter') {
      const client = new OpenAI({
        apiKey: cleanKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://dahab-device-doctor.vercel.app',
          'X-Title': 'Dahab Device Doctor',
        },
      });

      const models = [
        'meta-llama/llama-3.3-70b-instruct',
        'deepseek/deepseek-chat',
        'google/gemini-2.0-flash-001',
        'openai/gpt-4o-mini',
      ];
      let lastErr = null;

      for (const m of models) {
        try {
          const res = await client.chat.completions.create({
            model: m,
            messages: [{ role: 'user', content: 'Say OK in 1 word' }],
            max_tokens: 10,
          });
          const latencyMs = Date.now() - startTime;
          return {
            success: true,
            message: `متصل ويعمل بنجاح عبر OpenRouter (الموديل: ${m})`,
            latencyMs,
            modelUsed: m,
          };
        } catch (e: any) {
          lastErr = e;
          continue;
        }
      }
      throw lastErr || new Error('فشل فحص OpenRouter');
    }

    if (provider === 'openai') {
      const client = new OpenAI({ apiKey: cleanKey });
      const models = ['gpt-4o-mini', 'gpt-4o'];
      let lastErr = null;

      for (const m of models) {
        try {
          const res = await client.chat.completions.create({
            model: m,
            messages: [{ role: 'user', content: 'Say OK' }],
            max_tokens: 10,
          });
          const latencyMs = Date.now() - startTime;
          return {
            success: true,
            message: `متصل ويعمل بنجاح (الموديل: ${m})`,
            latencyMs,
            modelUsed: m,
          };
        } catch (e: any) {
          lastErr = e;
          continue;
        }
      }
      throw lastErr || new Error('فشل فحص OpenAI');
    }

    return {
      success: false,
      message: 'مزود غير مدعوم',
      latencyMs: Date.now() - startTime,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    let errMsg = err?.message || String(err);
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('credit_balance_exhausted')) {
      errMsg = 'تم رفض الطلب: انتهى رصيد الحساب (429 Insufficient Quota)';
    } else if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('Incorrect API key') || errMsg.includes('401')) {
      errMsg = 'المفتاح غير صحيح أو منتهي الصلاحية (401 Invalid Key)';
    }

    return {
      success: false,
      message: `فشل الاتصال بالمفتاح`,
      latencyMs,
      error: errMsg,
    };
  }
}
