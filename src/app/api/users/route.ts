import { NextRequest, NextResponse } from 'next/server';
import {
  getAllUsers,
  addUser,
  deleteUser,
  toggleUserStatus,
  extendSubscription,
  terminateUserSession,
  verifyLogin,
  updateUserHeartbeat,
  checkSubscription,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = getAllUsers().map(({ password, ...rest }) => {
      const sub = checkSubscription(rest as any);
      return {
        ...rest,
        subscriptionStatus: {
          isExpired: sub.isExpired,
          daysRemaining: sub.daysRemaining,
        },
      };
    });
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: 'فشل في جلب المستخدمين' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. تسجيل الدخول
    if (body.action === 'login') {
      const { username, password, deviceInfo } = body;
      if (!username) {
        return NextResponse.json({ error: 'اسم المستخدم مطلوب' }, { status: 400 });
      }
      const loginRes = verifyLogin(username, password, deviceInfo);
      if (!loginRes.user) {
        return NextResponse.json({ error: loginRes.error || 'فشل تسجيل الدخول' }, { status: 401 });
      }
      const { password: _, ...safeUser } = loginRes.user;
      return NextResponse.json({
        user: safeUser,
        sessionToken: loginRes.user.activeSessionToken,
        message: 'تم تسجيل الدخول بنجاح',
      });
    }

    // 2. تحديث نبض الجلسة والتحقق من عدم الفتح من جهاز آخر
    if (body.action === 'heartbeat') {
      const { username, sessionToken, deviceInfo } = body;
      if (!username || !sessionToken) {
        return NextResponse.json({ error: 'بيانات الجلسة غير مكتملة' }, { status: 400 });
      }
      const hb = updateUserHeartbeat(username, sessionToken, deviceInfo);
      if (!hb.valid) {
        return NextResponse.json({ error: hb.error, kicked: true }, { status: 403 });
      }
      return NextResponse.json({ success: true });
    }

    // 3. إضافة فني / مستخدم جديد بواسطة المشرف
    const { name, username, email, role, specialty, password, subscriptionDays, expiresAt } = body;

    if (!name || !username) {
      return NextResponse.json({ error: 'الاسم واسم المستخدم مطلوبان' }, { status: 400 });
    }

    const newUser = addUser({
      name,
      username,
      email: email || `${username}@doctor.com`,
      role: role || 'technician',
      specialty: specialty || 'فني صيانة إلكترونيات',
      password: password || '123456',
      active: true,
      subscriptionDays: subscriptionDays !== undefined ? Number(subscriptionDays) : 30,
      expiresAt: expiresAt || undefined,
    });

    const { password: _, ...safeUser } = newUser;
    return NextResponse.json({ user: safeUser, message: 'تم إصدار الحساب وتفعيله بنجاح' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'فشل في تنفيذ العملية' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, action, days } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    // تبديل حالة التفعيل / التعطيل
    if (action === 'toggleStatus') {
      const updated = toggleUserStatus(id);
      if (!updated) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
      return NextResponse.json({ user: updated });
    }

    // تمديد فترة الاشتراك بالأيام
    if (action === 'extendSubscription') {
      const daysToAdd = days !== undefined ? Number(days) : 30;
      const updated = extendSubscription(id, daysToAdd);
      if (!updated) return NextResponse.json({ error: 'تعذر تمديد الاشتراك' }, { status: 404 });
      return NextResponse.json({
        user: updated,
        message: `تم تمديد اشتراك الحساب بنجاح لمدة ${daysToAdd} يوم إضافية`,
      });
    }

    // إنهاء الجلسة وطرد المستخدم فوراً
    if (action === 'terminateSession') {
      const success = terminateUserSession(id);
      if (!success) return NextResponse.json({ error: 'تعذر إنهاء الجلسة' }, { status: 404 });
      return NextResponse.json({ message: 'تم إنهاء وطرد جلسة المستخدم بنجاح' });
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'فشل في تحديث بيانات المستخدم' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });

    const success = deleteUser(id);
    if (!success) return NextResponse.json({ error: 'تعذر حذف المستخدم' }, { status: 404 });
    return NextResponse.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (err) {
    return NextResponse.json({ error: 'فشل في حذف المستخدم' }, { status: 500 });
  }
}
