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

interface RepairOutcomeFeedback {
  type: 'repair_outcome';
  ticketId: string;
  actualReplacedComponent: string;
  repairTimeMinutes: number;
  repairNotes: string;
  aiAccuracy: 'accurate' | 'inaccurate' | 'partial';
  timestamp: string;
}

export async function POST(req: NextRequest) {
  try {
    const feedback = await req.json();

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
    let existingFeedback: (FeedbackData | RepairOutcomeFeedback)[] = [];
    try {
      const existingData = await fs.readFile(feedbackFile, 'utf-8');
      existingFeedback = JSON.parse(existingData);
    } catch {
      // الملف غير موجود، سنبدأ بمصفوفة فارغة
    }

    // معالجة أنواع مختلفة من Feedback
    if (feedback.type === 'repair_outcome') {
      // Repair Outcome Feedback
      const repairFeedback: RepairOutcomeFeedback = {
        ...feedback,
        timestamp: new Date().toISOString(),
      };
      existingFeedback.push(repairFeedback);
    } else {
      // Regular Feedback
      const regularFeedback: FeedbackData = {
        ...feedback,
        timestamp: new Date().toISOString(),
      };
      existingFeedback.push(regularFeedback);
    }

    // حفظ البيانات
    await fs.writeFile(feedbackFile, JSON.stringify(existingFeedback, null, 2), 'utf-8');

    return NextResponse.json(
      { success: true, message: 'تم حفظ البيانات بنجاح' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ البيانات' },
      { status: 500 }
    );
  }
}
