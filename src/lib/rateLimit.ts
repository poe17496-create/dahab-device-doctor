interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipStore = new Map<string, RateLimitRecord>();

export function isRateLimited(ip: string, limit: number = 15, windowMs: number = 60 * 1000): boolean {
  const now = Date.now();

  // Lazy Cleanup للمداخل القديمة
  for (const [storedIp, record] of ipStore.entries()) {
    if (now > record.resetTime) {
      ipStore.delete(storedIp);
    }
  }

  const record = ipStore.get(ip);

  if (!record || now > record.resetTime) {
    ipStore.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (record.count >= limit) {
    return true;
  }

  record.count += 1;
  return false;
}
