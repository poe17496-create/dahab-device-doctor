import { z } from 'zod';

/**
 * Schema للتحقق من طلبات الشات
 */
export const chatRequestSchema = z.object({
  message: z.string().max(20000, 'الرسالة طويلة جداً').optional().nullable(),
  imageBase64: z.string().optional().nullable(),
  chatHistory: z.array(z.any()).optional().nullable(),
  customKeys: z.any().optional().nullable(),
  stream: z.boolean().optional().default(false),
  diagnosticContext: z.any().optional().nullable(),
  username: z.string().optional().nullable(),
  sessionToken: z.string().optional().nullable(),
}).refine((data) => {
  // يجب أن يكون هناك إما رسالة نصية أو صورة
  const hasMessage = typeof data.message === 'string' && data.message.trim().length > 0;
  const hasImage = typeof data.imageBase64 === 'string' && data.imageBase64.trim().length > 0;
  return hasMessage || hasImage;
}, { message: 'يجب إرسال رسالة نصية أو صورة' }).passthrough();

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
