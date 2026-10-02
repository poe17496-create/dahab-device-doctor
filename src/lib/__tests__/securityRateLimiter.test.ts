import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  getClientIP,
  checkRateLimit,
  checkLoginBruteForce,
  sanitizeAndCheckTokenDrain,
} from '../securityRateLimiter';

describe('getClientIP', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const req = {
      headers: {
        get: vi.fn((name: string) => {
          if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
          return null;
        }),
      },
    } as unknown as NextRequest;

    const ip = getClientIP(req);
    expect(ip).toBe('192.168.1.1');
  });

  it('extracts IP from x-real-ip header', () => {
    const req = {
      headers: {
        get: vi.fn((name: string) => {
          if (name === 'x-real-ip') return '192.168.1.2';
          return null;
        }),
      },
    } as unknown as NextRequest;

    const ip = getClientIP(req);
    expect(ip).toBe('192.168.1.2');
  });

  it('extracts IP from cf-connecting-ip header', () => {
    const req = {
      headers: {
        get: vi.fn((name: string) => {
          if (name === 'cf-connecting-ip') return '192.168.1.3';
          return null;
        }),
      },
    } as unknown as NextRequest;

    const ip = getClientIP(req);
    expect(ip).toBe('192.168.1.3');
  });

  it('returns localhost when no headers present', () => {
    const req = {
      headers: {
        get: vi.fn(() => null),
      },
    } as unknown as NextRequest;

    const ip = getClientIP(req);
    expect(ip).toBe('127.0.0.1');
  });
});

describe('checkRateLimit', () => {
  it('allows requests within limit', () => {
    const req = {
      headers: {
        get: vi.fn(() => '192.168.1.10'),
      },
    } as unknown as NextRequest;

    const result = checkRateLimit(req, 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks requests exceeding limit', () => {
    const req = {
      headers: {
        get: vi.fn(() => '192.168.1.20'),
      },
    } as unknown as NextRequest;

    // Make 6 requests with limit of 5
    for (let i = 0; i < 6; i++) {
      const result = checkRateLimit(req, 5, 60000);
      if (i < 5) {
        expect(result.allowed).toBe(true);
      } else {
        expect(result.allowed).toBe(false);
      }
    }
  });
});

describe('checkLoginBruteForce', () => {
  it('allows login attempts within limit', () => {
    const req = {
      headers: {
        get: vi.fn(() => '192.168.1.40'),
      },
    } as unknown as NextRequest;

    const result = checkLoginBruteForce(req, 3, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(2);
  });

  it('blocks login attempts exceeding limit', () => {
    const req = {
      headers: {
        get: vi.fn(() => '192.168.1.50'),
      },
    } as unknown as NextRequest;

    // Make 4 attempts with limit of 3
    for (let i = 0; i < 4; i++) {
      const result = checkLoginBruteForce(req, 3, 60000);
      if (i < 3) {
        expect(result.allowed).toBe(true);
      } else {
        expect(result.allowed).toBe(false);
      }
    }
  });
});

describe('sanitizeAndCheckTokenDrain', () => {
  it('allows valid text within limit', () => {
    const result = sanitizeAndCheckTokenDrain('Hello world', 100);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('allows empty text', () => {
    const result = sanitizeAndCheckTokenDrain('', 100);
    expect(result.valid).toBe(true);
  });

  it('rejects text exceeding limit', () => {
    const result = sanitizeAndCheckTokenDrain('a'.repeat(5000), 4000);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('تم تجاوز الحد الأقصى');
  });

  it('uses default limit of 4000 characters', () => {
    const result = sanitizeAndCheckTokenDrain('a'.repeat(4001));
    expect(result.valid).toBe(false);
  });

  it('allows text exactly at limit', () => {
    const result = sanitizeAndCheckTokenDrain('a'.repeat(4000), 4000);
    expect(result.valid).toBe(true);
  });
});
