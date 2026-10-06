/**
 * Rate Limiting Utility
 * 
 * Lightweight in-memory rate limiter using LRU cache
 * Limits requests per IP address
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (Note: This resets on server restart/redeploy)
// For production, consider using Redis or Upstash
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries every minute
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  });
}, 60 * 1000);

/**
 * Check if request is rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 * @returns Object with allowed flag and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 15,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // If no entry exists or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
    };
  }

  // If limit exceeded
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Try various headers for IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to a hash of the request (not ideal but better than nothing)
  return 'unknown';
}

/**
 * Rate limit middleware for Next.js API routes
 */
export async function rateLimitMiddleware(
  request: Request,
  limit: number = 15,
  windowMs: number = 60 * 1000
): Promise<{ allowed: boolean; remaining: number; resetTime: number; identifier: string }> {
  const identifier = getClientIP(request);
  const result = checkRateLimit(identifier, limit, windowMs);
  
  return {
    ...result,
    identifier,
  };
}
