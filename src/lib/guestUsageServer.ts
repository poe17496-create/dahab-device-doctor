import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from './supabase';

export const GUEST_COOKIE_NAME = 'dahab_guest_id';
export const GUEST_LIMIT = 5;
export const IP_LIMIT = 10;

/**
 * حساب التاريخ بصيغة YYYY-MM-DD بتوقيت Africa/Cairo دائماً
 * دالة مركزية واحدة فقط تضمن عدم وجود أي مقارنات غير متوافقة
 */
export function getCairoToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
}

/**
 * استخراج أو إنشاء guestId من كوكي dahab_guest_id
 * إذا كان الكوكي موجوداً، يُعاد كما هو ولا يتم إنشاء معرف جديد أبداً
 */
export function getOrGenerateGuestId(req: Request | NextRequest): { guestId: string; isNew: boolean } {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${GUEST_COOKIE_NAME}=([^;]+)`));
  
  if (match && match[1] && match[1].trim()) {
    return { guestId: match[1].trim(), isNew: false };
  }

  // إنشاء UUID جديد للزائر لأول مرة
  const newGuestId = crypto.randomUUID();
  return { guestId: newGuestId, isNew: true };
}

/**
 * استخراج وتشفير عنوان IP بـ SHA-256 مع Salt للحفاظ على الخصوصية التامة
 */
export function getHashedClientIP(req: Request | NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfIP = req.headers.get('cf-connecting-ip');

  let rawIp = '127.0.0.1';
  if (forwarded) {
    rawIp = forwarded.split(',')[0].trim();
  } else if (realIP) {
    rawIp = realIP.trim();
  } else if (cfIP) {
    rawIp = cfIP.trim();
  }

  const salt = process.env.GUEST_IP_SALT || 'dahab_device_doctor_salt_2026';
  return crypto.createHash('sha256').update(`${rawIp}:${salt}`).digest('hex');
}

/**
 * إضافة كعكة الزائر (Cookie) إلى ترويسات الاستجابة
 * httpOnly + secure (في الإنتاج) + sameSite=lax مدتها سنة واحدة
 */
export function setGuestCookie(headers: Headers, guestId: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieString = `${GUEST_COOKIE_NAME}=${guestId}; Path=/; Max-Age=${365 * 24 * 60 * 60}; HttpOnly; SameSite=Lax${
    isProd ? '; Secure' : ''
  }`;
  headers.append('Set-Cookie', cookieString);
}

// =====================================================================
// مسار التخزين الاحتياطي المحلي الذري (في حال تعذر Supabase مؤقتاً)
// =====================================================================
const BASE_DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const GUEST_USAGE_FILE = path.join(BASE_DATA_DIR, 'guest_usage.json');

function readLocalGuestUsage(): Record<string, number> {
  try {
    if (!fs.existsSync(GUEST_USAGE_FILE)) return {};
    const content = fs.readFileSync(GUEST_USAGE_FILE, 'utf-8');
    return JSON.parse(content) || {};
  } catch {
    return {};
  }
}

function writeLocalGuestUsage(data: Record<string, number>): void {
  try {
    if (!fs.existsSync(BASE_DATA_DIR)) {
      fs.mkdirSync(BASE_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(GUEST_USAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[GuestUsageServer] Local write error:', err);
  }
}

/**
 * قراءة عدد المحاولات المستخدمة لليوم
 */
async function getUsedCount(key: string, day: string): Promise<number> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('guest_usage')
        .select('used')
        .eq('key', key)
        .eq('day', day)
        .maybeSingle();

      if (!error && data) {
        return typeof data.used === 'number' ? data.used : 0;
      }
      if (!error && !data) {
        return 0;
      }
    } catch (e) {
      console.warn('[GuestUsageServer] Supabase read error, falling back to local file:', e);
    }
  }

  // Fallback محلي
  const local = readLocalGuestUsage();
  return local[`${key}:${day}`] || 0;
}

/**
 * زيادة ذرية للعداد (Atomic Increment)
 * INSERT INTO guest_usage (key, day, used) VALUES (...) ON CONFLICT (key, day) DO UPDATE SET used = used + 1
 */
async function atomicIncrement(key: string, day: string): Promise<number> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      // تجربة استدعاء دالة RPC في Supabase
      const { data, error } = await supabaseAdmin.rpc('increment_guest_usage', {
        p_key: key,
        p_day: day,
      } as any);

      if (!error && typeof data === 'number') {
        return data;
      }

      // إذا كانت دالة RPC غير موجودة، محاولة upsert مباشر
      const current = await getUsedCount(key, day);
      const nextVal = current + 1;
      const { error: upsertErr } = await supabaseAdmin
        .from('guest_usage')
        .upsert(
          {
            key,
            day,
            used: nextVal,
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: 'key,day' }
        );

      if (!upsertErr) {
        return nextVal;
      }
    } catch (e) {
      console.warn('[GuestUsageServer] Supabase increment error, falling back to local file:', e);
    }
  }

  // Fallback محلي ذري
  const local = readLocalGuestUsage();
  const storageKey = `${key}:${day}`;
  const nextVal = (local[storageKey] || 0) + 1;
  local[storageKey] = nextVal;
  writeLocalGuestUsage(local);
  return nextVal;
}

/**
 * تراجع ذري للعداد (Atomic Rollback / Decrement) عند فشل الذكاء الاصطناعي
 */
async function atomicDecrement(key: string, day: string): Promise<number> {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.rpc('decrement_guest_usage', {
        p_key: key,
        p_day: day,
      } as any);

      if (!error && typeof data === 'number') {
        return data;
      }

      const current = await getUsedCount(key, day);
      const nextVal = Math.max(0, current - 1);
      await supabaseAdmin
        .from('guest_usage')
        .update({ used: nextVal, updated_at: new Date().toISOString() } as any)
        .eq('key', key)
        .eq('day', day);

      return nextVal;
    } catch (e) {
      console.warn('[GuestUsageServer] Supabase decrement error, falling back to local file:', e);
    }
  }

  // Fallback محلي
  const local = readLocalGuestUsage();
  const storageKey = `${key}:${day}`;
  const current = local[storageKey] || 0;
  const nextVal = Math.max(0, current - 1);
  local[storageKey] = nextVal;
  writeLocalGuestUsage(local);
  return nextVal;
}

/**
 * حساب عدد التجارب المتبقية للزائر
 * الأقل بين (5 - used للـ guest) و (10 - used للـ IP)
 */
export async function getGuestRemaining(req: Request | NextRequest): Promise<{
  remaining: number;
  guestId: string;
  isNewCookie: boolean;
  guestUsed: number;
  ipUsed: number;
}> {
  const { guestId, isNew } = getOrGenerateGuestId(req);
  const hashedIp = getHashedClientIP(req);
  const day = getCairoToday();

  const guestKey = `guest:${guestId}`;
  const ipKey = `ip:${hashedIp}`;

  const [guestUsed, ipUsed] = await Promise.all([
    getUsedCount(guestKey, day),
    getUsedCount(ipKey, day),
  ]);

  const guestRemaining = Math.max(0, GUEST_LIMIT - guestUsed);
  const ipRemaining = Math.max(0, IP_LIMIT - ipUsed);
  const remaining = Math.max(0, Math.min(guestRemaining, ipRemaining));

  return {
    remaining,
    guestId,
    isNewCookie: isNew,
    guestUsed,
    ipUsed,
  };
}

/**
 * فحص الرصيد والخصم الذري قبل استدعاء الذكاء الاصطناعي
 * إذا وصل الحد، يرجع 403 مع LIMIT_REACHED
 * إذا كان مسموحاً، يزيد العداد لكلا المفتاحين ذرياً
 */
export async function checkAndDeductGuestTrial(req: Request | NextRequest): Promise<{
  allowed: boolean;
  remaining: number;
  guestId: string;
  isNewCookie: boolean;
  error?: string;
}> {
  const { guestId, isNew } = getOrGenerateGuestId(req);
  const hashedIp = getHashedClientIP(req);
  const day = getCairoToday();

  const guestKey = `guest:${guestId}`;
  const ipKey = `ip:${hashedIp}`;

  const [guestUsed, ipUsed] = await Promise.all([
    getUsedCount(guestKey, day),
    getUsedCount(ipKey, day),
  ]);

  // التحقق من الحدود الصارمة
  if (guestUsed >= GUEST_LIMIT || ipUsed >= IP_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      guestId,
      isNewCookie: isNew,
      error: 'LIMIT_REACHED',
    };
  }

  // الخصم الذري لكلا المفتاحين
  const [newGuestUsed, newIpUsed] = await Promise.all([
    atomicIncrement(guestKey, day),
    atomicIncrement(ipKey, day),
  ]);

  const guestRemaining = Math.max(0, GUEST_LIMIT - newGuestUsed);
  const ipRemaining = Math.max(0, IP_LIMIT - newIpUsed);
  const remaining = Math.max(0, Math.min(guestRemaining, ipRemaining));

  return {
    allowed: true,
    remaining,
    guestId,
    isNewCookie: isNew,
  };
}

/**
 * استرجاع التجربة للزائر عند فشل الذكاء الاصطناعي أو حدوث خطأ
 */
export async function refundGuestTrial(req: Request | NextRequest, guestId: string): Promise<void> {
  try {
    const hashedIp = getHashedClientIP(req);
    const day = getCairoToday();
    const guestKey = `guest:${guestId}`;
    const ipKey = `ip:${hashedIp}`;

    await Promise.all([
      atomicDecrement(guestKey, day),
      atomicDecrement(ipKey, day),
    ]);
    console.log(`[GuestUsageServer] Successfully refunded trial for guest:${guestId}`);
  } catch (err) {
    console.error('[GuestUsageServer] Error refunding trial:', err);
  }
}
