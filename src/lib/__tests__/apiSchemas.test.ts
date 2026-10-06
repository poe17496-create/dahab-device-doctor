import { describe, it, expect } from 'vitest';
import {
  chatRequestSchema,
  boardviewUrlUploadSchema,
  feedbackRequestSchema,
  icLookupRequestSchema,
} from '../apiSchemas';

describe('chatRequestSchema', () => {
  it('validates valid chat request', () => {
    const validData = {
      message: 'Hello',
      chatHistory: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello' },
      ],
      stream: false,
    };

    const result = chatRequestSchema.parse(validData);
    expect(result).toEqual(validData);
  });

  it('rejects empty message', () => {
    const invalidData = { message: '' };
    expect(() => chatRequestSchema.parse(invalidData)).toThrow();
  });

  it('rejects message longer than 20000 characters', () => {
    const invalidData = { message: 'a'.repeat(20001) };
    expect(() => chatRequestSchema.parse(invalidData)).toThrow();
  });

  it('accepts optional fields', () => {
    const minimalData = { message: 'Test' };
    const result = chatRequestSchema.parse(minimalData);
    expect(result.message).toBe('Test');
  });

  it('validates chat history roles', () => {
    const invalidHistory = {
      message: 'Test',
      chatHistory: [{ role: 'invalid', content: 'test' }],
    };
    expect(() => chatRequestSchema.parse(invalidHistory)).toThrow();
  });
});

describe('boardviewUrlUploadSchema', () => {
  it('validates valid URL', () => {
    const validData = { url: 'https://example.com/boardview.pdf' };
    const result = boardviewUrlUploadSchema.parse(validData);
    expect(result.url).toBe('https://example.com/boardview.pdf');
  });

  it('rejects invalid URL', () => {
    const invalidData = { url: 'not-a-url' };
    expect(() => boardviewUrlUploadSchema.parse(invalidData)).toThrow();
  });

  it('rejects URL longer than 2000 characters', () => {
    const invalidData = { url: 'https://example.com/' + 'a'.repeat(2000) };
    expect(() => boardviewUrlUploadSchema.parse(invalidData)).toThrow();
  });
});

describe('feedbackRequestSchema', () => {
  it('validates valid feedback request', () => {
    const validData = {
      sessionId: 'session-123',
      deviceModel: 'iPhone 13',
      aiOutput: 'The issue is with the battery',
      wasAccurate: true,
      repairOutcome: {
        replacedComponent: 'Battery',
        timeSpentMinutes: 30,
        diagnosisAccuracy: 'accurate',
      },
    };

    const result = feedbackRequestSchema.parse(validData);
    expect(result.sessionId).toBe('session-123');
  });

  it('requires sessionId', () => {
    const invalidData = { wasAccurate: true };
    expect(() => feedbackRequestSchema.parse(invalidData)).toThrow();
  });

  it('validates diagnosisAccuracy enum', () => {
    const invalidData = {
      sessionId: 'session-123',
      wasAccurate: true,
      repairOutcome: { diagnosisAccuracy: 'invalid' },
    };
    expect(() => feedbackRequestSchema.parse(invalidData)).toThrow();
  });
});

describe('icLookupRequestSchema', () => {
  it('validates valid IC lookup request', () => {
    const validData = { q: 'PMIC' };
    const result = icLookupRequestSchema.parse(validData);
    expect(result.q).toBe('PMIC');
  });

  it('rejects empty query', () => {
    const invalidData = { q: '' };
    expect(() => icLookupRequestSchema.parse(invalidData)).toThrow();
  });

  it('rejects query longer than 100 characters', () => {
    const invalidData = { q: 'a'.repeat(101) };
    expect(() => icLookupRequestSchema.parse(invalidData)).toThrow();
  });
});
