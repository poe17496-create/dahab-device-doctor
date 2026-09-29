import { NextRequest, NextResponse } from 'next/server';
import {
  getAllGuests,
  recordGuestActivity,
  deleteGuestRecord,
  clearAllGuests,
} from '@/lib/guestStorage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawGuests = getAllGuests();
    const now = Date.now();

    const guests = rawGuests.map((g) => {
      const lastSeen = new Date(g.lastSeenAt).getTime();
      const isOnline = now - lastSeen < 3 * 60 * 1000; // متصل في آخر 3 دقائق
      return {
        ...g,
        isOnline,
      };
    });

    const activeCount = guests.filter((g) => g.isOnline).length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = guests.filter((g) => g.createdAt.startsWith(todayStr)).length;
    const totalDiagnoses = guests.reduce((sum, g) => sum + (g.diagnosesCount || 0), 0);

    return NextResponse.json({
      guests,
      activeCount,
      todayCount,
      totalDiagnoses,
    });
  } catch (err) {
    return NextResponse.json({ error: 'فشل في جلب سجلات الزائرين' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestId, action, deviceInfo, remaining } = body;

    if (!guestId) {
      return NextResponse.json({ error: 'معرف الزائر مطلوب' }, { status: 400 });
    }

    const recorded = recordGuestActivity(
      guestId,
      action || 'heartbeat',
      deviceInfo,
      remaining
    );

    return NextResponse.json({ success: true, guest: recorded });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'فشل في تسجيل نشاط الزائر' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (all === 'true') {
      clearAllGuests();
      return NextResponse.json({ success: true, message: 'تم مسح سجل الزوار بالكامل' });
    }

    if (!id) {
      return NextResponse.json({ error: 'معرف الزائر مطلوب' }, { status: 400 });
    }

    const success = deleteGuestRecord(id);
    return NextResponse.json({ success });
  } catch (err) {
    return NextResponse.json({ error: 'فشل في حذف سجل الزائر' }, { status: 500 });
  }
}
