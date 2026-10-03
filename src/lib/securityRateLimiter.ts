import { NextRequest, NextResponse } from 'next/server';

/**
 * @fileoverview Security Rate Limiter and Protection
 * 
 * This module provides security protections including:
 * - Rate limiting for API requests
 * - Brute-force attack protection for login
 * - Token drain protection
 * - IP extraction with proxy support
 * 
 * @module securityRateLimiter
 */

/**
 * Interface for rate limit records stored in memory
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory storage for rate limit records per IP
const ipRequestMap = new Map<string, RateLimitRecord>();
const loginAttemptMap = new Map<string, RateLimitRecord>();

// Periodic memory cleanup every 5 minutes
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
 * Extracts the real client IP address with proxy and cloud support
 * 
 * Checks multiple headers in order of priority:
 * 1. x-forwarded-for (for reverse proxies)
 * 2. x-real-ip (for direct connections)
 * 3. cf-connecting-ip (for Cloudflare)
 * 4. Falls back to 127.0.0.1
 * 
 * @param req - Next.js request object
 * @returns The client IP address as string
 * 
 * @example
 * ```ts
 * const ip = getClientIP(request);
 * console.log(`Client IP: ${ip}`);
 * ```
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
 * General DDoS protection and token drain prevention for repeated requests
 * 
 * Allows maximum 25 diagnostic/assistant requests per minute per IP
 * 
 * @param req - Next.js request object
 * @param maxRequests - Maximum allowed requests in time window (default: 25)
 * @param windowMs - Time window in milliseconds (default: 60000ms = 1 minute)
 * @returns Object with allowed status, remaining requests, and reset time
 * 
 * @example
 * ```ts
 * const result = checkRateLimit(request, 25, 60000);
 * if (!result.allowed) {
 *   return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
 * }
 * ```
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
 * Strict protection for login against brute-force attacks
 * 
 * Allows only 3 failed login attempts every 15 minutes (more strict)
 * 
 * @param req - Next.js request object
 * @param maxAttempts - Maximum allowed attempts (default: 3)
 * @param windowMs - Time window in milliseconds (default: 900000ms = 15 minutes)
 * @returns Object with allowed status, remaining attempts, and reset time
 * 
 * @example
 * ```ts
 * const result = checkLoginBruteForce(request, 3, 900000);
 * if (!result.allowed) {
 *   return NextResponse.json({ error: 'Too many login attempts' }, { status: 429 });
 * }
 * ```
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
 * Token drain protection (Prompt Token Abuse Shield)
 * 
 * Prevents sending huge texts designed to burn and consume tokens intentionally
 * 
 * @param text - Input text to validate
 * @param maxChars - Maximum allowed characters (default: 4000)
 * @returns Object with validation status and optional error message
 * 
 * @example
 * ```ts
 * const result = sanitizeAndCheckTokenDrain(userInput, 4000);
 * if (!result.valid) {
 *   return NextResponse.json({ error: result.error }, { status: 400 });
 * }
 * ```
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
