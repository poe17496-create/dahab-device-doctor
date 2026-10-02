import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyLogin } from '@/lib/auth';
import { checkLoginBruteForce } from '@/lib/securityRateLimiter';

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    const masterAdminPassword = process.env.ADMIN_PASSWORD || 'X7#K9@mP2$Qw8!Rz5*Ln3';
    const isMasterAdminLogin = cleanUsername.toLowerCase() === 'd3v1n_x9_admin' && cleanPassword === masterAdminPassword;

    // منع الدخول بالبيانات القديمة
    if (cleanUsername.toLowerCase() === 'dahab' || cleanPassword === 'dahab2026') {
      return NextResponse.json(
        { error: '⚠️ تم تحديث بيانات الأمان. يرجى استخدام البيانات الجديدة للدخول.' },
        { status: 403 }
      );
    }

    // 1. الفحص عبر Supabase إذا كانت مفعلة
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('username', cleanUsername)
          .single();

        if (!error && user) {
          // التحقق من كلمة المرور (مع قبول كلمة سر الماستر للأدمن)
          if (!isMasterAdminLogin && (user as any).password !== cleanPassword) {
            return NextResponse.json(
              { success: false, message: 'بيانات الدخول غير صحيحة (كلمة المرور خاطئة)' },
              { status: 401 }
            );
          }

          // التحقق من تفعيل الحساب
          if ((user as any).is_active === false) {
            return NextResponse.json(
              { success: false, message: 'حسابك معطل حالياً من قِبل المشرف، يرجى التواصل مع الإدارة' },
              { status: 403 }
            );
          }

          // التحقق من صلاحية الاشتراك (تاريخ الانتهاء)
          if ((user as any).expires_at) {
            const expDate = new Date((user as any).expires_at);
            if (!isNaN(expDate.getTime()) && expDate < new Date()) {
              return NextResponse.json(
                { success: false, message: 'انتهى اشتراكك، يرجى التواصل مع الإدارة للتحويل والتجديد' },
                { status: 403 }
              );
            }
          }

          // نظام قفل الجهاز الوحيد والتنقل اللحظي (Single Device Lock)
          if ((user as any).device_id !== effectiveDeviceId) {
            // إخطار المستخدم الجديد بأن شخص آخر يعمل الآن
            if ((user as any).device_id) {
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
            await supabaseAdmin
              .from('users')
              .update({
                device_id: effectiveDeviceId,
                updated_at: new Date().toISOString(),
              } as any)
              .eq('id', user.id);
          }

          return NextResponse.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح عبر Supabase',
            user: {
              id: String(user.id || (user as any).username),
              username: (user as any).username,
              name: (user as any).name || (user as any).username,
              role: (user as any).role || ((user as any).username === 'D3V1N_X9_ADMIN' ? 'admin' : 'technician'),
              expiresAt: (user as any).expires_at || null,
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
