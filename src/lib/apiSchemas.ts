import { z } from 'zod';

/**
 * Schema للتحقق من طلبات الشات
 */
export const chatRequestSchema = z.object({
  message: z.string().min(1, 'الرسالة مطلوبة').max(10000, 'الرسالة طويلة جداً'),
  imageBase64: z.string().optional(),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  customKeys: z.record(z.string(), z.string()).optional(),
  stream: z.boolean().optional().default(false),
  diagnosticContext: z.any().optional(),
}).passthrough();

export type ChatRequest = z.infer<typeof chatRequestSchema>;

/**
 * Schema للتحقق من طلبات رفع Boardview من URL
 */
export const boardviewUrlUploadSchema = z.object({
  url: z.string().url('رابط URL غير صالح').max(2000, 'الرابط طويل جداً'),
});

export type BoardviewUrlUploadRequest = z.infer<typeof boardviewUrlUploadSchema>;

/**
 * Schema للتحقق من طلبات Feedback
 */
export const feedbackRequestSchema = z.object({
  sessionId: z.string().min(1, 'معرف الجلسة مطلوب'),
  deviceModel: z.string().optional(),
  aiOutput: z.string().optional(),
  wasAccurate: z.boolean(),
  correctedComponent: z.string().optional(),
  repairOutcome: z.object({
    replacedComponent: z.string().optional(),
    timeSpentMinutes: z.number().optional(),
    diagnosisAccuracy: z.enum(['accurate', 'partial', 'inaccurate']).optional(),
    notes: z.string().optional(),
  }).optional(),
});

export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;

/**
 * Schema للتحقق من طلبات IC Lookup
 */
export const icLookupRequestSchema = z.object({
  q: z.string().min(1, 'البحث مطلوب').max(100, 'البحث طويل جداً'),
});

export type ICLookupRequest = z.infer<typeof icLookupRequestSchema>;
