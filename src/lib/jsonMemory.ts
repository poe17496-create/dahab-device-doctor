import fs from 'fs';
import path from 'path';
import { RepairSession, ChatMessage } from './types';

// على بيئة فيرسال السحابية يتم استخدام مجلد /tmp للكتابة
const BASE_DIR = process.env.VERCEL ? '/tmp' : process.cwd();
const DATA_DIR = path.join(BASE_DIR, 'data');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');

function ensureDirectories() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('خطأ أثناء تهيئة مجلدات الذاكرة:', err);
  }
}

function getSessionFilePath(sessionId: string): string {
  // ترويض الـ ID ليكون اسم ملف آمن
  const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(SESSIONS_DIR, `session_${safeId}.json`);
}

/**
 * جلب جميع جلسات الفحص السابقة المحفوظة في ملفات JSON
 */
export function getAllSessions(): RepairSession[] {
  ensureDirectories();
  try {
    const files = fs.readdirSync(SESSIONS_DIR).filter((f) => f.endsWith('.json'));
    const sessions: RepairSession[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(SESSIONS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const session = JSON.parse(content) as RepairSession;
        sessions.push(session);
      } catch (err) {
        console.error(`خطأ في قراءة ملف الجلسة ${file}:`, err);
      }
    }

    // ترتيب الجلسات من الأحدث إلى الأقدم
    return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.error('خطأ أثناء جلب الجلسات:', err);
    return [];
  }
}

/**
 * جلب جلسة فحص محددة بالمعرف الخاص بها
 */
export function getSessionById(sessionId: string): RepairSession | null {
  ensureDirectories();
  try {
    const filePath = getSessionFilePath(sessionId);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as RepairSession;
  } catch (err) {
    console.error(`خطأ أثناء قراءة الجلسة ${sessionId}:`, err);
    return null;
  }
}

/**
 * حفظ أو تحديث جلسة فحص في ملف JSON حتى لا ينسى الذكاء الاصطناعي تفاصيلها
 */
export function saveSession(session: RepairSession): RepairSession {
  ensureDirectories();
  const filePath = getSessionFilePath(session.id);
  session.updatedAt = new Date().toISOString();

  fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
  return session;
}

/**
 * إضافة رسالة جديدة إلى جلسة فحص قائمة وتحديث تاريخ التعديل
 */
export function appendMessageToSession(sessionId: string, message: ChatMessage): RepairSession {
  ensureDirectories();
  let session = getSessionById(sessionId);

  if (!session) {
    // إنشاء جلسة جديدة تلقائياً إذا لم تكن موجودة
    session = {
      id: sessionId,
      title: message.text.slice(0, 45) || 'جلسة فحص جديدة',
      deviceType: 'mobile-repair',
      deviceModel: 'جهاز غير محدد',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'in_progress',
      messages: [message],
    };
  } else {
    session.messages.push(message);
    if (message.readings) {
      session.powerReadings = { ...session.powerReadings, ...message.readings };
    }
    if (message.metrics) {
      session.metrics = message.metrics;
    }
  }

  return saveSession(session);
}

/**
 * حذف جلسة فحص من ملفات JSON
 */
export function deleteSession(sessionId: string): boolean {
  ensureDirectories();
  try {
    const filePath = getSessionFilePath(sessionId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`خطأ أثناء حذف الجلسة ${sessionId}:`, err);
    return false;
  }
}

/**
 * توليد ملخص سياقي كامل للجلسات السابقة وتمريره للذكاء الاصطناعي
 * حتى يستحضر كل القياسات والأعطال القديمة للجهاز
 */
export function buildSessionContextForAI(sessionId: string): string {
  const session = getSessionById(sessionId);
  if (!session || !session.messages.length) return '';

  let context = `\n--- [سجل ذاكرة الجلسة السابقة للجهاز من ملف الـ JSON] ---\n`;
  context += `معرف الجلسة: ${session.id}\n`;
  context += `نوع وتخصص الجهاز: ${session.deviceType}\n`;
  context += `طراز الجهاز: ${session.deviceModel}\n`;
  if (session.powerReadings) {
    context += `سحب الباور سبلاي المسجل: قبل التشغيل=${session.powerReadings.currentBeforePower || 0}mA | بعد التشغيل=${session.powerReadings.currentAfterPower || 'غير مسجل'}\n`;
  }
  if (session.metrics) {
    context += `التصنيف السابق: ${session.metrics.classification} (هاردوير ${session.metrics.hardwareProbability}% / سوفتوير ${session.metrics.softwareProbability}%)\n`;
  }

  context += `تاريخ الحوارات السابقة:\n`;
  for (const m of session.messages.slice(-8)) { // آخر 8 رسائل لتركيز السياق
    context += `[${m.sender === 'user' ? 'الفني' : 'منظومة دهب'}] (${m.timestamp}): ${m.text.slice(0, 300)}\n`;
  }
  context += `--- [نهاية سجل الذاكرة المحفوظة] ---\n\n`;

  return context;
}
