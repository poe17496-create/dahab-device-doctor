import { NextRequest, NextResponse } from 'next/server';
import {
  getAllSessions,
  getSessionById,
  saveSession,
  deleteSession,
  appendMessageToSession,
} from '@/lib/jsonMemory';
import { RepairSession } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const session = getSessionById(id);
      if (!session) {
        return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 });
      }
      return NextResponse.json({ session });
    }

    const sessions = getAllSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('API Memory GET error:', error);
    return NextResponse.json({ error: 'فشل في استرجاع سجلات الذاكرة' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'appendMessage') {
      const { sessionId, message } = body;
      if (!sessionId || !message) {
        return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
      }
      const updated = appendMessageToSession(sessionId, message);
      return NextResponse.json({ session: updated });
    }

    // حفظ الجلسة بالكامل
    const session: RepairSession = body.session;
    if (!session || !session.id) {
      return NextResponse.json({ error: 'بيانات الجلسة غير صالحة' }, { status: 400 });
    }

    const saved = saveSession(session);
    return NextResponse.json({ session: saved, message: 'تم حفظ الجلسة في ملف الـ JSON بنجاح' });
  } catch (error) {
    console.error('API Memory POST error:', error);
    return NextResponse.json({ error: 'فشل في حفظ بيانات الجلسة' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'يجب تحديد معرف الجلسة' }, { status: 400 });
    }

    const success = deleteSession(id);
    if (!success) {
      return NextResponse.json({ error: 'تعذر حذف الجلسة أو أنها غير موجودة' }, { status: 404 });
    }

    return NextResponse.json({ message: 'تم حذف الجلسة بنجاح' });
  } catch (error) {
    console.error('API Memory DELETE error:', error);
    return NextResponse.json({ error: 'فشل في حذف الجلسة' }, { status: 500 });
  }
}
