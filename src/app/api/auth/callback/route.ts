import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { 
  sanitizeRedirectUrl, 
  isSafeRedirectUrl, 
  addSecurityHeaders,
  isValidSessionToken 
} from '@/lib/security-redirect';
import { rateLimitMiddleware } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Auth Callback Route
 * 
 * Handles OAuth callbacks and secure redirects
 * Prevents Open Redirect vulnerabilities by validating all redirect URLs
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting: 10 requests per minute per IP (strict for auth callbacks)
    const rateLimitResult = await rateLimitMiddleware(req, 10, 60 * 1000);
    
    if (!rateLimitResult.allowed) {
      const errorResponse = NextResponse.json(
        { 
          error: 'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة.' 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
      return addSecurityHeaders(errorResponse);
    }

    if (!isSupabaseConfigured || !supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('Auth callback error:', error, errorDescription);
      const safeRedirect = sanitizeRedirectUrl(next, '/');
      return NextResponse.redirect(new URL(safeRedirect, req.url));
    }

    // Validate and sanitize redirect URL
    const safeRedirect = sanitizeRedirectUrl(next, '/');

    // If no code, redirect to home
    if (!code) {
      return NextResponse.redirect(new URL(safeRedirect, req.url));
    }

    // Exchange code for session using Supabase
    const { data, error: exchangeError } = await supabaseAdmin.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      return NextResponse.redirect(new URL(safeRedirect + '?error=auth_failed', req.url));
    }

    // Create response with secure redirect
    const response = NextResponse.redirect(new URL(safeRedirect, req.url));

    // Set session cookies securely
    if (data.session) {
      // Set access token cookie
      response.cookies.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      // Set refresh token cookie
      if (data.session.refresh_token) {
        response.cookies.set('sb-refresh-token', data.session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: '/',
        });
      }
    }

    // Add security headers
    return addSecurityHeaders(response);
  } catch (error: any) {
    console.error('Auth callback error:', error);
    
    // Safe redirect to home on error
    const { searchParams } = new URL(req.url);
    const next = searchParams.get('next');
    const safeRedirect = sanitizeRedirectUrl(next, '/');
    
    const errorResponse = NextResponse.redirect(
      new URL(safeRedirect + '?error=server_error', req.url)
    );
    return addSecurityHeaders(errorResponse);
  }
}

/**
 * POST handler for custom auth flows
 * Validates session tokens and prevents token injection
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 10 requests per minute per IP
    const rateLimitResult = await rateLimitMiddleware(req, 10, 60 * 1000);
    
    if (!rateLimitResult.allowed) {
      const errorResponse = NextResponse.json(
        { 
          error: 'تجاوزت الحد المسموح من الطلبات، يرجى الانتظار دقيقة.' 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          }
        }
      );
      return addSecurityHeaders(errorResponse);
    }

    const body = await req.json();
    const { sessionToken, redirectUrl } = body;

    // Validate session token format
    if (!isValidSessionToken(sessionToken)) {
      const errorResponse = NextResponse.json(
        { error: 'Invalid session token format' },
        { status: 400 }
      );
      return addSecurityHeaders(errorResponse);
    }

    // Validate redirect URL
    const safeRedirect = sanitizeRedirectUrl(redirectUrl, '/');

    // Return safe redirect URL
    const successResponse = NextResponse.json({
      success: true,
      redirectUrl: safeRedirect,
    });
    return addSecurityHeaders(successResponse);
  } catch (error: any) {
    console.error('Auth callback POST error:', error);
    
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    return addSecurityHeaders(errorResponse);
  }
}
