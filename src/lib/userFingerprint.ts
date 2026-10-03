import crypto from 'crypto';

/**
 * Generate a unique device fingerprint using multiple factors
 * This prevents users from bypassing limits by just changing browser or IP
 */
export function generateDeviceFingerprint(req: Request): string {
  // Extract user agent
  const userAgent = req.headers.get('user-agent') || 'unknown';

  // Extract IP (with proxy support)
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '0.0.0.0';

  // Extract Accept-Language (helps identify region)
  const acceptLanguage = req.headers.get('accept-language') || 'en';

  // Extract Accept-Encoding (browser signature)
  const acceptEncoding = req.headers.get('accept-encoding') || 'gzip';

  // Create a combined fingerprint string
  const fingerprintString = `${ip}|${userAgent}|${acceptLanguage}|${acceptEncoding}`;

  // Hash it to create a unique ID
  const hash = crypto
    .createHash('sha256')
    .update(fingerprintString)
    .digest('hex');

  return hash;
}

/**
 * Extract session ID from cookie or generate new one
 */
export function getOrCreateSessionId(req: Request): string {
  const cookieHeader = req.headers.get('cookie') || '';

  // Try to extract existing session cookie
  const sessionMatch = cookieHeader.match(/dahab_session=([^;]+)/);
  if (sessionMatch && sessionMatch[1]) {
    return sessionMatch[1];
  }

  // Generate new session ID
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate a comprehensive user identifier combining:
 * - Device fingerprint (IP + User Agent + Headers)
 * - Session ID (persistent cookie)
 */
export function generateUserIdentifier(req: Request): {
  deviceId: string;
  sessionId: string;
  combinedId: string;
} {
  const deviceId = generateDeviceFingerprint(req);
  const sessionId = getOrCreateSessionId(req);

  // Combine both for maximum uniqueness
  const combinedId = crypto
    .createHash('sha256')
    .update(`${deviceId}:${sessionId}`)
    .digest('hex');

  return {
    deviceId,
    sessionId,
    combinedId,
  };
}
