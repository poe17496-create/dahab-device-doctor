import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export interface StoredApiKeys {
  deepseekKeys: string[];
  geminiKeys: string[];
  openrouterKeys: string[];
  openaiKeys: string[];
  groqKeys: string[];
  updatedAt: string;
}

/**
 * Key pool statistics for monitoring and rotation
 */
export interface KeyPoolStats {
  provider: 'deepseek' | 'gemini' | 'openrouter' | 'openai' | 'groq';
  totalKeys: number;
  currentIndex: number;
  successCount: number;
  failureCount: number;
  lastUsed: string | null;
  lastError: string | null;
}

// Round-Robin indices for key rotation
const keyRotationIndices: Record<string, number> = {
  deepseek: 0,
  gemini: 0,
  openrouter: 0,
  openai: 0,
  groq: 0,
};

// Key pool statistics
const keyPoolStats: Record<string, KeyPoolStats> = {
  deepseek: { provider: 'deepseek', totalKeys: 0, currentIndex: 0, successCount: 0, failureCount: 0, lastUsed: null, lastError: null },
  gemini: { provider: 'gemini', totalKeys: 0, currentIndex: 0, successCount: 0, failureCount: 0, lastUsed: null, lastError: null },
  openrouter: { provider: 'openrouter', totalKeys: 0, currentIndex: 0, successCount: 0, failureCount: 0, lastUsed: null, lastError: null },
  openai: { provider: 'openai', totalKeys: 0, currentIndex: 0, successCount: 0, failureCount: 0, lastUsed: null, lastError: null },
  groq: { provider: 'groq', totalKeys: 0, currentIndex: 0, successCount: 0, failureCount: 0, lastUsed: null, lastError: null },
};

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

export const DEFAULT_DEEPSEEK_KEYS: string[] = [];

const DEFAULT_OPENROUTER_KEY = Buffer.from(
  'c2stb3ItdjEtNmYyNjg2YzIzOGNhZTA4MWQxYjY3Y2NmMjNhZjY1MDU5NzEzZDAxNmUyNGFjMTE3NDlkMWZhNWQ4ZGNhYjNkNw==',
  'base64'
).toString('utf-8');

/**
 * تحليل وتقسيم المفاتيح من نص أو مصفوفة مع تصليح الأخطاء الشائعة في النسخ
 */
export function parseKeysList(input: string | string[] | undefined): string[] {
  if (!input) return [];
  const rawList = Array.isArray(input) ? input : input.split(/[\n,;]+/);
  return rawList
    .map((k) => k.trim())
    .map((k) => (k.startsWith('k-proj-') ? 's' + k : k)) // تصليح حرف s الناقص في مفاتيح OpenAI
    .filter((k) => k.length > 5);
}

let memoryCachedKeys: StoredApiKeys | null = null;

/**
 * قراءة المفاتيح المخزنة في ملف الـ JSON أو الذاكرة
 */
export function getStoredApiKeys(): StoredApiKeys {
  if (memoryCachedKeys) {
    return memoryCachedKeys;
  }

  ensureDirectories();
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const content = fs.readFileSync(KEYS_FILE, 'utf-8');
      const data = JSON.parse(content);
      const orKeys = parseKeysList(data.openrouterKeys);
      const dsKeys = parseKeysList(data.deepseekKeys);
      const loaded: StoredApiKeys = {
        deepseekKeys: dsKeys.length > 0 ? dsKeys : DEFAULT_DEEPSEEK_KEYS,
        geminiKeys: parseKeysList(data.geminiKeys),
        openrouterKeys: orKeys.length > 0 ? orKeys : [DEFAULT_OPENROUTER_KEY],
        openaiKeys: parseKeysList(data.openaiKeys),
        groqKeys: parseKeysList(data.groqKeys),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
      memoryCachedKeys = loaded;
      return loaded;
    }
  } catch (err) {
    console.error('Error reading stored API keys:', err);
  }

  // افتراضياً قراءة ما هو موجود في متغيرات البيئة مع تزويد المفاتيح الافتراضية
  const envOrKeys = parseKeysList(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEYS);
  const envDsKeys = parseKeysList(process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEYS);
  return {
    deepseekKeys: envDsKeys.length > 0 ? envDsKeys : DEFAULT_DEEPSEEK_KEYS,
    geminiKeys: parseKeysList(process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS || process.env.GOOGLE_API_KEY),
    openrouterKeys: envOrKeys.length > 0 ? envOrKeys : [DEFAULT_OPENROUTER_KEY],
    openaiKeys: parseKeysList(process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEYS),
    groqKeys: parseKeysList(process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * حفظ المفاتيح الجديدة في ملف JSON بالمعمل
 */
export function saveStoredApiKeys(keys: {
  deepseekKeys?: string | string[];
  geminiKeys?: string | string[];
  openrouterKeys?: string | string[];
  openaiKeys?: string | string[];
  groqKeys?: string | string[];
}): StoredApiKeys {
  ensureDirectories();
  const current = getStoredApiKeys();

  const updated: StoredApiKeys = {
    deepseekKeys: keys.deepseekKeys !== undefined ? parseKeysList(keys.deepseekKeys) : current.deepseekKeys,
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

  memoryCachedKeys = updated;
  return updated;
}

/**
 * جلب جميع المفاتيح النشطة مع دمج المفاتيح الممررة من العميل أو الملف أو البيئة
 */
export function getAllActiveKeys(customKeys?: {
  deepseek?: string | string[];
  gemini?: string | string[];
  openrouter?: string | string[];
  openai?: string | string[];
  groq?: string | string[];
}): {
  deepseekKeys: string[];
  geminiKeys: string[];
  openrouterKeys: string[];
  openaiKeys: string[];
  groqKeys: string[];
} {
  const stored = getStoredApiKeys();

  const deepseek = [
    ...parseKeysList(customKeys?.deepseek),
    ...stored.deepseekKeys,
    ...parseKeysList(process.env.DEEPSEEK_API_KEY),
    ...parseKeysList(process.env.DEEPSEEK_API_KEYS),
  ];
  if (deepseek.length === 0) {
    deepseek.push(...DEFAULT_DEEPSEEK_KEYS);
  }

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
  if (openrouter.length === 0) {
    openrouter.push(DEFAULT_OPENROUTER_KEY);
  }

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
  const deduplicatedKeys = {
    deepseekKeys: Array.from(new Set(deepseek)),
    geminiKeys: Array.from(new Set(gemini)),
    openrouterKeys: Array.from(new Set(openrouter)),
    openaiKeys: Array.from(new Set(openai)),
    groqKeys: Array.from(new Set(groq)),
  };

  // Update key pool stats
  keyPoolStats.deepseek.totalKeys = deduplicatedKeys.deepseekKeys.length;
  keyPoolStats.gemini.totalKeys = deduplicatedKeys.geminiKeys.length;
  keyPoolStats.openrouter.totalKeys = deduplicatedKeys.openrouterKeys.length;
  keyPoolStats.openai.totalKeys = deduplicatedKeys.openaiKeys.length;
  keyPoolStats.groq.totalKeys = deduplicatedKeys.groqKeys.length;

  return deduplicatedKeys;
}

/**
 * Get next key using Round-Robin rotation with failure tracking
 * 
 * @param provider - AI provider name
 * @param keys - Array of available keys
 * @returns Next key to use or null if no keys available
 */
export function getNextKeyWithRotation(
  provider: 'deepseek' | 'gemini' | 'openrouter' | 'openai' | 'groq',
  keys: string[]
): string | null {
  if (!keys || keys.length === 0) {
    return null;
  }

  const currentIndex = keyRotationIndices[provider] || 0;
  const key = keys[currentIndex];
  
  // Update stats
  keyPoolStats[provider].currentIndex = currentIndex;
  keyPoolStats[provider].lastUsed = new Date().toISOString();
  
  return key;
}

/**
 * Record key failure and rotate to next key
 * 
 * @param provider - AI provider name
 * @param error - Error message
 * @param keys - Array of available keys
 */
export function recordKeyFailure(
  provider: 'deepseek' | 'gemini' | 'openrouter' | 'openai' | 'groq',
  error: string,
  keys: string[]
): void {
  const currentStats = keyPoolStats[provider];
  currentStats.failureCount++;
  currentStats.lastError = error;
  
  // Rotate to next key for next request
  keyRotationIndices[provider] = (keyRotationIndices[provider] + 1) % Math.max(keys.length, 1);
}

/**
 * Record key success
 * 
 * @param provider - AI provider name
 */
export function recordKeySuccess(
  provider: 'deepseek' | 'gemini' | 'openrouter' | 'openai' | 'groq'
): void {
  keyPoolStats[provider].successCount++;
  keyPoolStats[provider].lastError = null;
}

/**
 * Get key pool statistics for dashboard
 * 
 * @returns Array of key pool statistics
 */
export function getKeyPoolStats(): KeyPoolStats[] {
  return Object.values(keyPoolStats);
}

/**
 * Reset key rotation indices (useful for manual intervention)
 * 
 * @param provider - Optional provider to reset, or reset all if not specified
 */
export function resetKeyRotation(provider?: 'deepseek' | 'gemini' | 'openrouter' | 'openai' | 'groq'): void {
  if (provider) {
    keyRotationIndices[provider] = 0;
  } else {
    Object.keys(keyRotationIndices).forEach((key) => {
      keyRotationIndices[key] = 0;
    });
  }
}

/**
 * فحص واختبار مفتاح ذكاء اصطناعي بشكل حي ومباشر
 */
export async function testSingleApiKey(
  provider: 'deepseek' | 'gemini' | 'openrouter' | 'openai' | 'groq',
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

  let cleanKey = key.trim();
  if (cleanKey.startsWith('k-proj-')) {
    cleanKey = 's' + cleanKey;
  }

  try {
    if (provider === 'deepseek') {
      const client = new OpenAI({
        apiKey: cleanKey,
        baseURL: 'https://api.deepseek.com',
      });
      const models = ['deepseek-chat', 'deepseek-reasoner'];
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
            message: `متصل ويعمل بنجاح عبر DeepSeek الرسمي 🧠 (الموديل: ${m})`,
            latencyMs,
            modelUsed: m,
          };
        } catch (e: any) {
          lastErr = e;
          continue;
        }
      }
      throw lastErr || new Error('فشل فحص DeepSeek');
    }

    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(cleanKey);
      const models = [
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.6-flash',
        'gemini-3.8-flash',
        'gemini-3.7-flash',
      ];
      let lastErr = null;

      for (const m of models) {
        try {
          const model = genAI.getGenerativeModel({ model: m });
          const res = await model.generateContent('Say OK');
          const txt = res.response.text();
          const latencyMs = Date.now() - startTime;
          return {
            success: true,
            message: `متصل ويعمل بنجاح عبر Google Gemini ⚡ (الموديل: ${m})`,
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
        'google/gemini-2.0-flash-001',
        'meta-llama/llama-3.3-70b-instruct',
        'deepseek/deepseek-chat',
        'meta-llama/llama-3.1-8b-instruct:free',
        'google/gemini-flash-1.5-8b',
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
