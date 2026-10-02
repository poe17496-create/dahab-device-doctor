import { describe, it, expect, vi } from 'vitest';
import { NextResponse } from 'next/server';
import {
  createErrorResponse,
  handleZodError,
  handleGenericError,
  withErrorHandling,
  withTimeout,
  ErrorCode,
} from '../apiErrorHandler';
import { ZodError } from 'zod';

describe('createErrorResponse', () => {
  it('creates error response with default status 500', async () => {
    const response = createErrorResponse('Test error');
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      error: 'Test error',
      code: ErrorCode.INTERNAL_ERROR,
      timestamp: expect.any(String),
    });
  });

  it('creates error response with custom status', async () => {
    const response = createErrorResponse('Not found', ErrorCode.NOT_FOUND, 404);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toMatchObject({
      error: 'Not found',
      code: ErrorCode.NOT_FOUND,
    });
  });

  it('includes details when provided', async () => {
    const response = createErrorResponse('Validation error', ErrorCode.VALIDATION_ERROR, 400, {
      field: 'email',
      message: 'Invalid email format',
    });
    const data = await response.json();

    expect(data).toMatchObject({
      details: {
        field: 'email',
        message: 'Invalid email format',
      },
    });
  });
});

describe('handleZodError', () => {
  it('handles Zod validation errors', async () => {
    const zodError = new ZodError([
      {
        code: 'invalid_type',
        expected: 'string',
        received: 'number',
        path: ['email'],
        message: 'Expected string, received number',
      },
    ]);

    const response = handleZodError(zodError);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      error: 'بيانات المدخلات غير صالحة',
      code: ErrorCode.VALIDATION_ERROR,
      details: expect.arrayContaining([
        expect.objectContaining({
          path: 'email',
          message: 'Expected string, received number',
        }),
      ]),
    });
  });
});

describe('handleGenericError', () => {
  it('handles Error instances', async () => {
    const error = new Error('Generic error');
    const response = handleGenericError(error);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      error: expect.any(String),
      code: ErrorCode.INTERNAL_ERROR,
    });
  });

  it('handles unknown errors', async () => {
    const response = handleGenericError('string error');
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      error: 'حدث خطأ غير معروف',
    });
  });
});

describe('withTimeout', () => {
  it('resolves when promise completes before timeout', async () => {
    const promise = Promise.resolve('success');
    const result = await withTimeout(promise, 1000, 'Timeout');

    expect(result).toBe('success');
  });

  it('rejects when promise exceeds timeout', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('late'), 2000));
    
    await expect(withTimeout(promise, 100, 'Timeout')).rejects.toThrow('Timeout');
  });
});

describe('withErrorHandling', () => {
  it('executes handler successfully', async () => {
    const mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const wrappedHandler = withErrorHandling(mockHandler);
    
    const mockReq = { json: vi.fn().mockResolvedValue({}) } as any;
    const response = await wrappedHandler(mockReq);
    const data = await response.json();

    expect(data).toMatchObject({ success: true });
  });

  it('catches and handles errors', async () => {
    const mockHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
    const wrappedHandler = withErrorHandling(mockHandler);
    
    const mockReq = { json: vi.fn().mockResolvedValue({}) } as any;
    const response = await wrappedHandler(mockReq);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      error: expect.any(String),
    });
  });
});
