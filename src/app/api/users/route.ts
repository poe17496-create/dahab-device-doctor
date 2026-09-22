import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, addUser, deleteUser, toggleUserStatus } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = getAllUsers().map(({ password, ...rest }) => rest);
    return NextResponse.json({ users });
  } catch (err) {
    return NextResponse.json({ error: 'فشل في جلب المستخدمين' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, username, email, role, specialty, password } = body;

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
    });

    const { password: _, ...safeUser } = newUser;
    return NextResponse.json({ user: safeUser, message: 'تم إضافة المستخدم بنجاح' });
  } catch (err) {
    return NextResponse.json({ error: 'فشل في إضافة المستخدم' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, action } = await req.json();
    if (action === 'toggleStatus' && id) {
      const updated = toggleUserStatus(id);
      if (!updated) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
      return NextResponse.json({ user: updated });
    }
    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'فشل في تحديث المستخدم' }, { status: 500 });
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
