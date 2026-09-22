import { NextRequest, NextResponse } from 'next/server';
import { verifyLogin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username) {
      return NextResponse.json({ error: 'اسم المستخدم مطلوب' }, { status: 400 });
    }

    const user = verifyLogin(username, password);
    if (!user) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب معطل' }, { status: 401 });
    }

    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser, message: 'تم تسجيل الدخول بنجاح' });
  } catch (err) {
    return NextResponse.json({ error: 'خطأ في الخادم أثناء تسجيل الدخول' }, { status: 500 });
  }
}
