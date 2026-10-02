import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, addUser } from '@/lib/auth';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - جلب جميع المستخدمين
export async function GET(req: NextRequest) {
  try {
    const users = getAllUsers();
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

    let supabaseSaved = false;

    // 1. الحفظ في جدول users بـ Supabase
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const payload: any = {
          username: cleanUsername,
          password: cleanPassword,
          expires_at: expiresAt,
          is_active: true,
          device_id: null, // يتقفل أوتوماتيك مع أول دخول
        };

        // إضافة الحقول الاختيارية إذا كانت موجودة
        if (name) payload.name = name;
        if (specialty) payload.specialty = specialty;
        if (price !== undefined) payload.price = Number(price);

        const { data, error } = await supabaseAdmin
          .from('users')
          .insert([payload] as any)
          .select();

        if (error) {
          // إذا كان الخطأ بسبب أعمدة إضافية، نعيد الإدخال بالأعمدة الأساسية فقط
          console.warn('Supabase extended insert notice, retrying with core columns:', error.message);
          const corePayload = {
            username: cleanUsername,
            password: cleanPassword,
            expires_at: expiresAt,
            is_active: true,
            device_id: null,
          };
          const { error: coreErr } = await supabaseAdmin.from('users').insert([corePayload] as any);
          if (coreErr) throw coreErr;
        }

        supabaseSaved = true;
      } catch (sbErr: any) {
        console.error('Supabase add user error:', sbErr);
        // نستمر لحفظه محلياً حتى لا يتعطل المشرف
      }
    }

    // 2. الحفظ التزامني في الذاكرة المحلية لضمان استمرارية العمل فوراً
    try {
      addUser({
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
    } catch (localErr) {
      console.warn('Local add user note:', localErr);
    }

    return NextResponse.json({
      success: true,
      message: supabaseSaved
        ? 'تم إضافة الفني وتفعيله بنجاح في Supabase والسيرفر! ✓'
        : 'تم إضافة الفني وتفعيله بنجاح! ✓',
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
