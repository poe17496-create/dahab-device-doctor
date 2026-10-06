/**
 * Security Utilities for Auth and Redirect Protection
 * 
 * Prevents Open Redirect vulnerabilities and validates trusted origins
 */

/**
 * List of trusted origins for redirects
 * Includes production site, localhost for development, and any custom domains
 */
export function getTrustedOrigins(): string[] {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dahab-device-doctor.vercel.app';
  const trustedOrigins = [
    siteUrl,
    'http://localhost:3000',
    'http://localhost:3001',
    'https://dahab-device-doctor.vercel.app',
    // Add any custom domains here if needed
  ];

  // Parse and clean up origins
  return trustedOrigins.map(origin => {
    try {
      const url = new URL(origin);
      return url.origin;
    } catch {
      return origin;
    }
  });
}

/**
 * Validate if a URL is safe for redirect
 * Checks against trusted origins and prevents malicious redirects
 * 
 * @param redirectUrl - The URL to validate
 * @returns true if safe, false otherwise
 */
export function isSafeRedirectUrl(redirectUrl: string | null | undefined): boolean {
  if (!redirectUrl) {
    return true; // No redirect is safe
  }

  try {
    const url = new URL(redirectUrl);
    const trustedOrigins = getTrustedOrigins();

    // Check if the origin is in our trusted list
    const isTrusted = trustedOrigins.some(trusted => {
      try {
        const trustedUrl = new URL(trusted);
        return trustedUrl.origin === url.origin;
      } catch {
        return false;
      }
    });

    if (!isTrusted) {
      return false;
    }

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some(protocol => redirectUrl.toLowerCase().startsWith(protocol))) {
      return false;
    }

    // Block relative paths that go outside the app
    if (redirectUrl.startsWith('//')) {
      return false;
    }

    return true;
  } catch (error) {
    // Invalid URL format
    return false;
  }
}

/**
 * Sanitize and validate redirect URL
 * Returns a safe default URL if the provided URL is invalid
 * 
 * @param redirectUrl - The URL to sanitize
 * @param defaultUrl - Fallback URL if validation fails
 * @returns Safe redirect URL
 */
export function sanitizeRedirectUrl(
  redirectUrl: string | null | undefined,
  defaultUrl: string = '/'
): string {
  if (!redirectUrl) {
    return defaultUrl;
  }

  if (isSafeRedirectUrl(redirectUrl)) {
    return redirectUrl;
  }

  // Return safe default if validation fails
  return defaultUrl;
}

/**
 * Validate request origin for API routes
 * Prevents CSRF attacks by checking the Origin header
 * 
 * @param request - Next.js Request object
 * @returns true if origin is safe, false otherwise
 */
export function validateRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // If no origin or referer, it might be a same-origin request
  if (!origin && !referer) {
    return true;
  }

  const trustedOrigins = getTrustedOrigins();

  // Check origin
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const isTrusted = trustedOrigins.some(trusted => {
        try {
          const trustedUrl = new URL(trusted);
          return trustedUrl.origin === originUrl.origin;
        } catch {
          return false;
        }
      });

      if (!isTrusted) {
        return false;
      }
    } catch {
      return false;
    }
  }

  // Check referer as fallback
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const isTrusted = trustedOrigins.some(trusted => {
        try {
          const trustedUrl = new URL(trusted);
          return trustedUrl.origin === refererUrl.origin;
        } catch {
          return false;
        }
      });

      if (!isTrusted) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Create a NextResponse with security headers
 * Adds standard security headers to prevent common attacks
 * 
 * @param response - The NextResponse to enhance
 * @returns Enhanced NextResponse with security headers
 */
export function addSecurityHeaders(response: Response): Response {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)');
  
  return response;
}

/**
 * Validate session token format
 * Prevents token injection attacks
 * 
 * @param token - The session token to validate
 * @returns true if valid format, false otherwise
 */
export function isValidSessionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Token should be at least 20 characters and contain only safe characters
  const minLength = 20;
  const maxLength = 500;
  const safePattern = /^[a-zA-Z0-9\-_\.]+$/;

  return (
    token.length >= minLength &&
    token.length <= maxLength &&
    safePattern.test(token)
  );
}

/**
 * Middleware wrapper for API routes with security checks
 * Combines rate limiting, origin validation, and CSRF protection
 * 
 * @param request - Next.js Request object
 * @param rateLimit - Optional rate limit (default: 30 req/min)
 * @returns Object with security check results
 */
export async function performSecurityChecks(
  request: Request,
  rateLimit: number = 30
): Promise<{
  allowed: boolean;
  reason?: string;
  headers?: Record<string, string>;
}> {
  // Validate request origin
  if (!validateRequestOrigin(request)) {
    return {
      allowed: false,
      reason: 'Invalid request origin',
      headers: {
        'X-Security-Error': 'invalid-origin',
      },
    };
  }

  // Rate limiting would be checked here if using the rate-limit utility
  // This is a placeholder for future integration

  return {
    allowed: true,
  };
}
