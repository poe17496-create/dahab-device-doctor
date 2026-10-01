import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

interface FeedbackData {
  sessionId: string;
  deviceModel: string;
  aiOutput: string;
  wasAccurate: boolean;
  correctedComponent?: string;
  timestamp: string;
}

export async function POST(req: NextRequest) {
  try {
    const feedback: FeedbackData = await req.json();

    // التحقق من البيانات
    if (!feedback.sessionId || !feedback.deviceModel || !feedback.aiOutput) {
      return NextResponse.json(
        { error: 'بيانات غير مكتملة' },
        { status: 400 }
      );
    }

    // مسار حفظ بيانات Feedback
    const feedbackDir = path.join(process.cwd(), 'data', 'feedback');
    const feedbackFile = path.join(feedbackDir, 'feedback-log.json');

    // إنشاء المجلد إذا لم يكن موجوداً
    try {
      await fs.access(feedbackDir);
    } catch {
      await fs.mkdir(feedbackDir, { recursive: true });
    }

    // قراءة البيانات الحالية
    let existingFeedback: FeedbackData[] = [];
    try {
      const existingData = await fs.readFile(feedbackFile, 'utf-8');
      existingFeedback = JSON.parse(existingData);
    } catch {
      // الملف غير موجود، سنبدأ بمصفوفة فارغة
    }

    // إضافة الـ Feedback الجديد
    existingFeedback.push(feedback);

    // حفظ البيانات
    await fs.writeFile(feedbackFile, JSON.stringify(existingFeedback, null, 2), 'utf-8');

    return NextResponse.json(
      { success: true, message: 'تم حفظ ملاحظاتك بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ الملاحظات' },
      { status: 500 }
    );
  }
}
