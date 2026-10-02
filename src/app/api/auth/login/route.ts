import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { verifyLogin } from '@/lib/auth';
import { checkLoginBruteForce } from '@/lib/securityRateLimiter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 🛡️ فحص حماية من هجمات التخمين والـ Brute-Force
    const bruteCheck = checkLoginBruteForce(req);
    if (!bruteCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `🛡️ تم إيقاف محاولات الدخول مؤقتاً لحماية الحساب من الهجمات. يرجى الانتظار ${bruteCheck.resetInMinutes} دقيقة والمحاولة لاحقاً.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { username, password, currentDeviceId, deviceInfo } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const effectiveDeviceId = currentDeviceId || deviceInfo || 'Web-Client';
    const masterAdminPassword = process.env.ADMIN_PASSWORD || 'Dahab_Master_2026#Sec';
    const isMasterAdminLogin = cleanUsername.toLowerCase() === 'dahab' && cleanPassword === masterAdminPassword;

    // 1. الفحص عبر Supabase إذا كانت مفعلة
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', cleanUsername)
          .single();

        if (!error && user) {
          // التحقق من كلمة المرور (مع قبول كلمة سر الماستر للأدمن)
          if (!isMasterAdminLogin && user.password !== cleanPassword) {
            return NextResponse.json(
              { success: false, message: 'بيانات الدخول غير صحيحة (كلمة المرور خاطئة)' },
              { status: 401 }
            );
          }

          // التحقق من تفعيل الحساب
          if (user.is_active === false) {
            return NextResponse.json(
              { success: false, message: 'حسابك معطل حالياً من قِبل المشرف، يرجى التواصل مع الإدارة' },
              { status: 403 }
            );
          }

          // التحقق من صلاحية الاشتراك (تاريخ الانتهاء)
          if (user.expires_at) {
            const expDate = new Date(user.expires_at);
            if (!isNaN(expDate.getTime()) && expDate < new Date()) {
              return NextResponse.json(
                { success: false, message: 'انتهى اشتراكك، يرجى التواصل مع الإدارة للتحويل والتجديد' },
                { status: 403 }
              );
            }
          }

          // نظام قفل الجهاز الوحيد والتنقل اللحظي (Single Device Lock)
          if (user.device_id !== effectiveDeviceId) {
            // إخطار المستخدم الجديد بأن شخص آخر يعمل الآن
            if (user.device_id) {
              return NextResponse.json(
                {
                  success: false,
                  message: '⚠️ هذا الحساب مسجل الدخول حالياً من جهاز آخر. يرجى التأكد من أنك قمت بتسجيل الخروج من الجهاز الآخر أولاً، أو انتظر حتى يخرج المستخدم الآخر.',
                  requireLogout: true,
                },
                { status: 409 }
              );
            }

            // تحديث معرف الجهاز للجهاز الجديد فوراً لطرد الجهاز القديم في نفس اللحظة
            await supabase
              .from('users')
              .update({
                device_id: effectiveDeviceId,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id);
          }

          return NextResponse.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح عبر Supabase',
            user: {
              id: String(user.id || user.username),
              username: user.username,
              name: user.name || user.username,
              role: user.role || (user.username === 'D3V1N_X9_ADMIN' ? 'admin' : 'technician'),
              expiresAt: user.expires_at || null,
              active: true,
              deviceId: effectiveDeviceId,
            },
            sessionToken: effectiveDeviceId,
          });
        }
      } catch (sbErr) {
        console.warn('Supabase login check failed, falling back to local:', sbErr);
      }
    }

    // 2. الفحص الاحتياطي عبر قاعدة البيانات المحلية (Local Fallback)
    const localLogin = verifyLogin(cleanUsername, cleanPassword, effectiveDeviceId);
    if (!localLogin.user) {
      return NextResponse.json(
        { success: false, message: localLogin.error || 'بيانات الدخول غير صحيحة أو الحساب غير موجود' },
        { status: 401 }
      );
    }

    const { password: _, ...safeUser } = localLogin.user;
    return NextResponse.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: safeUser,
      sessionToken: localLogin.user.activeSessionToken || effectiveDeviceId,
    });
  } catch (err: any) {
    console.error('Login Route Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'حدث خطأ في معالجة طلب الدخول' },
      { status: 500 }
    );
  }
}
