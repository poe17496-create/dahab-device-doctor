import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, addUser } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - جلب جميع المستخدمين
export async function GET(req: NextRequest) {
  try {
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (err: any) {
    console.error('Admin Get Users Error:', err);
    return NextResponse.json(
      { success: false, message: 'فشل في جلب المستخدمين' },
      { status: 500 }
    );
  }
}

// POST - إضافة مستخدم جديد
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, durationDays, name, specialty, price } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'اسم المستخدم وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();
    const cleanPassword = String(password).trim();
    const isUnlimited = durationDays === 'unlimited' || !durationDays || durationDays === '0';

    // حساب تاريخ انتهاء الاشتراك
    let expiresAt: string | null = null;
    if (!isUnlimited) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + parseInt(String(durationDays), 10));
      expiresAt = expDate.toISOString();
    }

    // حفظ في Supabase عبر auth.ts
    try {
      await addUser({
        name: name || cleanUsername,
        username: cleanUsername,
        email: `${cleanUsername}@doctor.com`,
        role: 'technician',
        specialty: specialty || 'فني صيانة إلكترونيات',
        password: cleanPassword,
        active: true,
        subscriptionDays: isUnlimited ? undefined : parseInt(String(durationDays), 10),
        expiresAt: expiresAt || undefined,
        price: price !== undefined ? Number(price) : 50,
      });
    } catch (localErr: any) {
      console.error('Add user error:', localErr);
      return NextResponse.json(
        { success: false, message: localErr?.message || 'فشل في إضافة الفني' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم إضافة الفني وتفعيله بنجاح! ✓',
      user: {
        username: cleanUsername,
        expiresAt,
        isUnlimited,
      },
    });
  } catch (err: any) {
    console.error('Admin Add User Route Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'فشل في إضافة الفني' },
      { status: 500 }
    );
  }
}
