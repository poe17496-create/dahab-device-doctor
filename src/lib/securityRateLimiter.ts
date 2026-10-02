import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// تخزين محلي بالذاكرة للمعدلات الحالية لكل IP
const ipRequestMap = new Map<string, RateLimitRecord>();
const loginAttemptMap = new Map<string, RateLimitRecord>();

// تنظيف دوري للذاكرة كل 5 دقائق
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    ipRequestMap.forEach((record, ip) => {
      if (now > record.resetTime) {
        ipRequestMap.delete(ip);
      }
    });
    loginAttemptMap.forEach((record, ip) => {
      if (now > record.resetTime) {
        loginAttemptMap.delete(ip);
      }
    });
  }, 5 * 60 * 1000);
}

/**
 * استخراج عنوان IP الحقيقي للعميل مع دعم البروكسي والسحابة
 */
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return '127.0.0.1';
}

/**
 * حماية عامة من الـ DDoS واستنزاف التوكن للطلبات المتكررة
 * يسمح بحد أقصى 25 طلب تشخيص/مساعد لكل دقيقة لكل IP
 */
export function checkRateLimit(req: NextRequest, maxRequests = 25, windowMs = 60 * 1000): { allowed: boolean; remaining: number; resetInSec: number } {
  const ip = getClientIP(req);
  const now = Date.now();

  const record = ipRequestMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    ipRequestMap.set(ip, record);
    return { allowed: true, remaining: maxRequests - 1, resetInSec: Math.ceil(windowMs / 1000) };
  }

  record.count += 1;
  ipRequestMap.set(ip, record);

  const resetInSec = Math.ceil((record.resetTime - now) / 1000);

  if (record.count > maxRequests) {
    return { allowed: false, remaining: 0, resetInSec };
  }

  return { allowed: true, remaining: maxRequests - record.count, resetInSec };
}

/**
 * حماية مشددة لتسجيل الدخول من هجمات التخمين (Brute-Force Attack Protection)
 * يسمح بـ 3 محاولات دخول خاطئة فقط كل 15 دقيقة (أكثر صرامة)
 */
export function checkLoginBruteForce(req: NextRequest, maxAttempts = 3, windowMs = 15 * 60 * 1000): { allowed: boolean; remainingAttempts: number; resetInMinutes: number } {
  const ip = getClientIP(req);
  const now = Date.now();

  const record = loginAttemptMap.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    loginAttemptMap.set(ip, record);
    return { allowed: true, remainingAttempts: maxAttempts - 1, resetInMinutes: Math.ceil(windowMs / 60000) };
  }

  record.count += 1;
  loginAttemptMap.set(ip, record);

  const resetInMinutes = Math.ceil((record.resetTime - now) / 60000);

  if (record.count > maxAttempts) {
    return { allowed: false, remainingAttempts: 0, resetInMinutes };
  }

  return { allowed: true, remainingAttempts: maxAttempts - record.count, resetInMinutes };
}

/**
 * فحص استنزاف التوكن (Prompt Token Abuse Shield)
 * يمنع إرسال نصوص ضخمة مصممة لحرق واستهلاك التوكن عمداً
 */
export function sanitizeAndCheckTokenDrain(text: string, maxChars = 4000): { valid: boolean; error?: string } {
  if (!text) return { valid: true };
  if (text.length > maxChars) {
    return {
      valid: false,
      error: `تم تجاوز الحد الأقصى لحجم الرسالة (${maxChars} حرف). يرجى تقليص الوصف لحماية موارد السيرفر.`,
    };
  }
  return { valid: true };
}
