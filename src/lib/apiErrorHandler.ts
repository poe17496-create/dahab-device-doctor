import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';

/**
 * واجهة الخطأ المُهيكل
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: any;
  timestamp: string;
  path?: string;
}

/**
 * أنواع الأخطاء المخصصة
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * دالة لإنشاء استجابة خطأ مُهيكل
 */
export function createErrorResponse(
  error: string,
  code: ErrorCode = ErrorCode.INTERNAL_ERROR,
  status: number = 500,
  details?: any
): NextResponse {
  const errorResponse: ApiError = {
    error,
    code,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  };

  console.error('API Error:', errorResponse);

  return NextResponse.json(errorResponse, { status });
}

/**
 * دالة لمعالجة أخطاء Zod
 */
export function handleZodError(error: ZodError): NextResponse {
  const details = error.issues.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return createErrorResponse(
    'بيانات المدخلات غير صالحة',
    ErrorCode.VALIDATION_ERROR,
    400,
    details
  );
}

/**
 * دالة لمعالجة الأخطاء العامة
 */
export function handleGenericError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  if (error instanceof Error) {
    // تسجيل الخطأ في السجلات
    console.error('Unhandled API Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return createErrorResponse(
      process.env.NODE_ENV === 'production' 
        ? 'حدث خطأ في الخادم' 
        : error.message,
      ErrorCode.INTERNAL_ERROR,
      500
    );
  }

  return createErrorResponse(
    'حدث خطأ غير معروف',
    ErrorCode.INTERNAL_ERROR,
    500
  );
}

/**
 * HOC لتغليف API routes مع معالجة الأخطاء
 */
export function withErrorHandling<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse | Response>,
  schema?: ZodSchema<any>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse | Response> => {
    try {
      // التحقق من صحة البيانات باستخدام Zod إذا كان schema موجود
      if (schema) {
        try {
          const clonedReq = req.clone();
          const body = await clonedReq.json();
          schema.parse(body);
        } catch (error) {
          if (error instanceof ZodError) {
            return handleZodError(error);
          }
        }
      }

      // تنفيذ الـ handler الأصلي
      return await handler(req, ...args);
    } catch (error) {
      return handleGenericError(error);
    }
  };
}

/**
 * دالة لمعالجة timeouts
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'انتهت مهلة الطلب'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * دالة لمعالجة retries مع exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delay = baseDelay * Math.pow(2, attempt);
      
      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
