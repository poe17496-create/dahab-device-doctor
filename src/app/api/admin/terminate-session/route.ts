import { NextRequest, NextResponse } from 'next/server';
import { terminateUserSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    const success = terminateUserSession(userId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'تم إنهاء الجلسة بنجاح',
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'المستخدم غير موجود' },
        { status: 404 }
      );
    }
  } catch (err: any) {
    console.error('Terminate Session Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'فشل في إنهاء الجلسة' },
      { status: 500 }
    );
  }
}
