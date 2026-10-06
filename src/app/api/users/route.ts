import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import {
  getAllUsers,
  saveAllUsers,
  addUser,
  deleteUser,
  toggleUserStatus,
  extendSubscription,
  terminateUserSession,
  verifyLogin,
  updateUserHeartbeat,
  checkSubscription,
  UserAccount,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Rate limiting: allow 1 user creation per minute
const userCreationTimestamps: number[] = [];
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_USER_CREATIONS_PER_WINDOW = 1;

function checkRateLimit(): boolean {
  const now = Date.now();
  // Remove timestamps older than the window
  const recentTimestamps = userCreationTimestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);

  if (recentTimestamps.length >= MAX_USER_CREATIONS_PER_WINDOW) {
    return false;
  }

  // Add current timestamp
  userCreationTimestamps.push(now);
  return true;
}

export async function GET() {
  try {
    const users = await getAllUsers();

    const usersWithoutPassword = users.map(({ password, ...rest }) => {
      const sub = checkSubscription(rest as any);
      return {
        ...rest,
        subscriptionStatus: {
          isExpired: sub.isExpired,
          daysRemaining: sub.daysRemaining,
        },
      };
    });

    return NextResponse.json({ users: usersWithoutPassword });
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
      if (!username || !password) {
        return NextResponse.json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 });
      }

      const cleanUsername = String(username).trim();
      const cleanPassword = String(password).trim();
      const currentDeviceId = deviceInfo || 'Web-Device';

      // منع الدخول بالبيانات القديمة
      if (cleanUsername.toLowerCase() === 'dahab' || cleanPassword === 'dahab2026') {
        return NextResponse.json(
          { error: '⚠️ تم تحديث بيانات الأمان. يرجى استخدام البيانات الجديدة للدخول.' },
          { status: 403 }
        );
      }

      // فحص Supabase أولاً إن كانت مفعلة مع ميزة قفل الجهاز الوحيد
      if (isSupabaseConfigured && supabaseAdmin) {
        try {
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('username', cleanUsername)
            .single();

          if (!error && user) {
            if (user.password !== cleanPassword) {
              return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
            }
            if (user.is_active === false) {
              return NextResponse.json({ error: 'الحساب معطل من قبل المشرف' }, { status: 403 });
            }
            if (user.expires_at) {
              const expDate = new Date(user.expires_at);
              if (!isNaN(expDate.getTime()) && expDate < new Date()) {
                return NextResponse.json({ error: 'انتهت صلاحية اشتراك هذا الحساب' }, { status: 403 });
              }
            }

            // نظام جلسة واحدة نشطة (Single Active Session)
            // إذا فتح من جهاز جديد، يغلق الجهاز القديم تلقائياً بدون رسالة خطأ
            await supabaseAdmin
              .from('users')
              .update({ device_id: currentDeviceId, updated_at: new Date().toISOString() })
              .eq('id', user.id);

            // استخدام device_id كـ sessionToken (القيمة الموحدة في Supabase)
            const sessionToken = currentDeviceId;

            return NextResponse.json({
              user: {
                id: String(user.id || user.username),
                username: user.username,
                name: user.name || user.username,
                role: user.role || (user.username === 'D3V1N_X9_ADMIN' ? 'admin' : 'technician'),
                active: true,
                expiresAt: user.expires_at || undefined,
                activeSessionToken: sessionToken, // إضافة activeSessionToken لتوحيد البيانات
              },
              sessionToken: sessionToken,
              message: 'تم تسجيل الدخول بنجاح',
            });
          }
        } catch (sbErr) {
          console.warn('Supabase login check note:', sbErr);
        }
      }

      // الفحص المحلي
      const loginRes = await verifyLogin(cleanUsername, cleanPassword, currentDeviceId);
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

      // فحص Supabase إذا كانت مفعلة للتأكد من مطابقة device_id
      if (isSupabaseConfigured && supabaseAdmin) {
        try {
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('device_id, is_active')
            .eq('username', username.trim())
            .single();

          if (!error && user) {
            if (user.is_active === false) {
              return NextResponse.json({ error: 'تم تعطيل الحساب من قِبل المشرف', kicked: true }, { status: 403 });
            }
            // نظام جلسة واحدة نشطة - لا يوجد فحص device_id mismatch
          }
        } catch (sbErr) {
          console.warn('Supabase heartbeat note:', sbErr);
        }
      }

      const hbResult = await updateUserHeartbeat(username, sessionToken, deviceInfo) as { valid: boolean; user?: UserAccount; error?: string };
      if (!hbResult.valid) {
        if (hbResult.error?.includes('غير متاح')) {
          return NextResponse.json({ success: true, rebuilt: true });
        }
        // في حالة فشل heartbeat بسبب device mismatch، نسمح بالاستمرار مع تحديث device_id
        console.warn('[Users API] Heartbeat failed, but allowing session:', hbResult.error);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ success: true });
    }

    // 3. إضافة فني / مستخدم جديد بواسطة المشرف
    const { name, username, email, role, specialty, password, subscriptionDays, expiresAt, price } = body;

    if (!name || !username) {
      return NextResponse.json({ error: 'الاسم واسم المستخدم مطلوبان' }, { status: 400 });
    }

    // Rate limiting check
    if (!checkRateLimit()) {
      return NextResponse.json(
        { error: 'يمكنك إضافة مستخدم واحد فقط في الدقيقة الواحدة. يرجى الانتظار دقيقة ثم المحاولة مرة أخرى.' },
        { status: 429 }
      );
    }

    const cleanUsername = String(username).trim();
    const cleanPassword = password || '123456';
    const isUnlimited = subscriptionDays === 'unlimited' || subscriptionDays === undefined;

    let computedExpiresAt: string | undefined = undefined;
    if (!isUnlimited) {
      if (expiresAt) {
        computedExpiresAt = expiresAt;
      } else {
        const d = new Date();
        d.setDate(d.getDate() + Number(subscriptionDays || 30));
        computedExpiresAt = d.toISOString();
      }
    }

    // حفظ في Supabase إن كانت متصلة
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const payload: any = {
          username: cleanUsername,
          password: cleanPassword,
          expires_at: computedExpiresAt || null,
          is_active: true,
          device_id: null,
        };
        if (name) payload.name = name;
        if (specialty) payload.specialty = specialty;
        if (price !== undefined) payload.price = Number(price);

        const { error } = await supabaseAdmin.from('users').insert([payload]);
        if (error) {
          console.error('Supabase insert error:', error);
          // محاولة ثانية بالحقول الأساسية فقط
          const fallbackPayload = {
            username: cleanUsername,
            password: cleanPassword,
            expires_at: computedExpiresAt || null,
            is_active: true,
            device_id: null,
          };
          const { error: fallbackError } = await supabaseAdmin.from('users').insert([fallbackPayload]);
          if (fallbackError) {
            console.error('Supabase fallback insert error:', fallbackError);
            // نستمر رغم الخطأ لأن الحفظ المحلي سينجح
          }
        }
      } catch (sbErr) {
        console.error('Supabase insert exception:', sbErr);
        // نستمر رغم الخطأ لأن الحفظ المحلي سينجح
      }
    }

    // حفظ محلي
    const newUserResult = await addUser({
      name,
      username: cleanUsername,
      email: email || `${cleanUsername}@doctor.com`,
      role: role || 'technician',
      specialty: specialty || 'فني صيانة إلكترونيات',
      password: cleanPassword,
      active: true,
      subscriptionDays: isUnlimited ? undefined : Number(subscriptionDays),
      expiresAt: computedExpiresAt,
      price: price !== undefined ? Number(price) : 2900,
    }) as UserAccount;

    const { password: _, ...safeUser } = newUserResult;
    return NextResponse.json({ user: safeUser, message: 'تم إصدار الحساب وتفعيله بنجاح' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'فشل في تنفيذ العملية' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, days } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    // تبديل حالة التفعيل / التعطيل
    if (action === 'toggleStatus') {
      const updated = await toggleUserStatus(id) as UserAccount | null;
      if (isSupabaseConfigured && supabaseAdmin && updated) {
        try {
          await supabaseAdmin.from('users').update({ is_active: updated.active }).eq('username', updated.username);
        } catch (e) {}
      }
      if (!updated) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
      return NextResponse.json({ user: updated });
    }

    // تمديد فترة الاشتراك بالأيام
    if (action === 'extendSubscription') {
      const daysToAdd = days !== undefined ? Number(days) : 30;
      const updated = await extendSubscription(id, daysToAdd) as UserAccount | null;
      if (isSupabaseConfigured && supabaseAdmin && updated) {
        try {
          await supabaseAdmin.from('users').update({ expires_at: updated.expiresAt }).eq('username', updated.username);
        } catch (e) {}
      }
      if (!updated) return NextResponse.json({ error: 'تعذر تمديد الاشتراك' }, { status: 404 });
      return NextResponse.json({
        user: updated,
        message: `تم تمديد اشتراك الحساب بنجاح لمدة ${daysToAdd} يوم إضافية`,
      });
    }

    // إنهاء الجلسة وطرد المستخدم فوراً
    if (action === 'terminateSession') {
      const success = await terminateUserSession(id);
      const allUsers = await getAllUsers() as UserAccount[];
      const user = allUsers.find((u: UserAccount) => u.id === id);
      if (isSupabaseConfigured && supabaseAdmin && user) {
        try {
          await supabaseAdmin.from('users').update({ device_id: null }).eq('username', user.username);
        } catch (e) {}
      }
      if (!success) return NextResponse.json({ error: 'تعذر إنهاء الجلسة' }, { status: 404 });
      return NextResponse.json({ message: 'تم إنهاء وطرد جلسة المستخدم بنجاح' });
    }

    // تعديل بيانات المستخدم
    if (action === 'updateUser') {
      const users = await getAllUsers() as UserAccount[];
      const user = users.find((u: UserAccount) => u.id === id);
      if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });

      if (body.name) user.name = body.name;
      if (body.specialty !== undefined) user.specialty = body.specialty;
      if (body.password && body.password.trim()) user.password = body.password.trim();
      if (body.price !== undefined) user.price = Number(body.price) || 0;

      if (body.subscriptionDays !== undefined) {
        if (
          body.subscriptionDays === 'unlimited' ||
          body.subscriptionDays === null ||
          body.subscriptionDays === 'open' ||
          Number(body.subscriptionDays) === 0
        ) {
          user.expiresAt = undefined;
          user.subscriptionDays = undefined;
        } else {
          const daysNum = Number(body.subscriptionDays);
          if (daysNum > 0) {
            user.expiresAt = new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000).toISOString();
            user.subscriptionDays = daysNum;
          }
        }
      }

      await saveAllUsers(users);

      if (isSupabaseConfigured && supabaseAdmin) {
        try {
          const updatePayload: any = {
            expires_at: user.expiresAt || null,
          };
          if (body.name) updatePayload.name = body.name;
          if (body.password && body.password.trim()) updatePayload.password = body.password.trim();
          if (body.price !== undefined) updatePayload.price = Number(body.price);
          await supabaseAdmin.from('users').update(updatePayload).eq('username', user.username);
        } catch (e) {}
      }

      return NextResponse.json({ user, message: 'تم تحديث بيانات المستخدم بنجاح' });
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

    const all = await getAllUsers();
    const user = all.find((u) => u.id === id || u.username.toLowerCase() === id.toLowerCase());
    // 1. حذف محلياً وتسجيل في المقبرة
    await deleteUser(id);
    if (user?.username) {
      await deleteUser(user.username);
    }

    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const usernameToDelete = user?.username || id;
        // بدلاً من الحذف الفعلي نضع علامة __DELETED__ حتى لا يرجع عند cold start
        await supabaseAdmin.from('users').update({
          is_active: false,
          device_id: '__DELETED__',
        }).eq('username', usernameToDelete);
        // أيضاً نحاول الحذف الفعلي
        await supabaseAdmin.from('users').delete().eq('username', usernameToDelete);
      } catch (e) {
        console.warn('Supabase delete error:', e);
      }
    }

    return NextResponse.json({ message: 'تم حذف المستخدم نهائياً' });
  } catch (err) {
    return NextResponse.json({ error: 'فشل في حذف المستخدم' }, { status: 500 });
  }
}
