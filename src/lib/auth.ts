import { supabaseAdmin, isSupabaseConfigured } from './supabase';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'technician';
  specialty?: string;
  password?: string;
  passwordHash?: string;
  active: boolean;
  diagnosesCount: number;
  createdAt: string;
  activeSessionToken?: string;
  lastLoginAt?: string;
  lastSeenAt?: string;
  isOnline?: boolean;
  deviceInfo?: string;
  expiresAt?: string;
  subscriptionDays?: number;
  price?: number;
  loginAttempts?: number;
  lockedUntil?: string;
  isGuest?: boolean;
}

const DEFAULT_ADMIN: UserAccount = {
  id: 'user_admin',
  username: 'D3V1N_X9_ADMIN',
  name: 'المهندس إسلام دهب (المشرف العام ومطور المنظومة)',
  email: 'dahab@doctor.com',
  role: 'admin',
  specialty: 'كبير مهندسي الإلكترونيات والميكروسولديرنج ومطور أنظمة دهب',
  password: process.env.ADMIN_PASSWORD || '',
  active: true,
  diagnosesCount: 185,
  createdAt: '2026-01-01T00:00:00.000Z',
  isOnline: true,
  lastSeenAt: new Date().toISOString(),
  expiresAt: undefined,
};

// Cache بسيط في الذاكرة لتقليل الاستعلامات
let usersCache: UserAccount[] | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 دقائق

async function getAllUsersFromSupabase(): Promise<UserAccount[]> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    console.warn('Supabase not configured, using default admin only');
    return [DEFAULT_ADMIN];
  }

  // تحقق من الـ cache
  const now = Date.now();
  if (usersCache && now < cacheExpiry) {
    return usersCache;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*');

    if (error) {
      console.error('Error fetching users from Supabase:', error);
      return [DEFAULT_ADMIN];
    }

    if (!data || data.length === 0) {
      // إذا لم يوجد مستخدمين، أضف الـ admin الافتراضي
      await supabaseAdmin.from('users').insert({
        id: DEFAULT_ADMIN.id,
        email: DEFAULT_ADMIN.email,
        username: DEFAULT_ADMIN.username,
        password: DEFAULT_ADMIN.password,
        name: DEFAULT_ADMIN.name,
        role: DEFAULT_ADMIN.role,
        specialty: DEFAULT_ADMIN.specialty,
        is_active: true,
      });
      return [DEFAULT_ADMIN];
    }

    // تحويل البيانات من Supabase إلى UserAccount
    const users: UserAccount[] = data.map((u: any) => ({
      id: u.id,
      username: u.username,
      name: u.name || u.username,
      email: u.email,
      role: u.role || 'technician',
      specialty: u.specialty,
      password: u.password,
      active: u.is_active !== false,
      diagnosesCount: 0, // يمكن إضافة هذا الحقل لاحقاً
      createdAt: u.created_at,
      activeSessionToken: u.device_id, // استخدام device_id كـ session token
      lastLoginAt: u.updated_at,
      lastSeenAt: u.updated_at,
      isOnline: u.is_active === true,
      deviceInfo: u.device_id,
      expiresAt: u.expires_at,
      price: u.price,
    }));

    // تحديث الـ cache
    usersCache = users;
    cacheExpiry = now + CACHE_TTL;

    return users;
  } catch (error) {
    console.error('Error in getAllUsersFromSupabase:', error);
    return [DEFAULT_ADMIN];
  }
}

export async function getAllUsers(): Promise<UserAccount[]> {
  return await getAllUsersFromSupabase();
}

export async function saveAllUsers(users: UserAccount[]): Promise<boolean> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    console.warn('Supabase not configured, cannot save users');
    return false;
  }

  try {
    // تحديث الـ cache
    usersCache = users;
    cacheExpiry = Date.now() + CACHE_TTL;

    // تحديث كل مستخدم في Supabase
    for (const user of users) {
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          specialty: user.specialty,
          password: user.password,
          is_active: user.active,
          device_id: user.deviceInfo,
          expires_at: user.expiresAt,
          price: user.price,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user:', user.username, error);
      }
    }

    return true;
  } catch (error) {
    console.error('Error in saveAllUsers:', error);
    return false;
  }
}

export function checkSubscription(user: UserAccount): { isExpired: boolean; daysRemaining: number } {
  if (!user.expiresAt || user.role === 'admin') {
    return { isExpired: false, daysRemaining: 9999 };
  }
  const exp = new Date(user.expiresAt).getTime();
  const now = Date.now();
  const diffMs = exp - now;
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return {
    isExpired: daysRemaining <= 0,
    daysRemaining: Math.max(0, daysRemaining),
  };
}

export async function addUser(
  user: Omit<UserAccount, 'id' | 'createdAt' | 'diagnosesCount'> & { subscriptionDays?: number }
): Promise<UserAccount> {
  const users = await getAllUsers();

  // التحقق من عدم تكرار اسم المستخدم
  const existingUser = users.find(
    (u) => u.username.toLowerCase() === user.username.toLowerCase()
  );
  if (existingUser) {
    throw new Error('اسم المستخدم موجود بالفعل');
  }

  // شرط 8 أحرف فقط للمشرف، وليس للمستخدمين العاديين
  if (user.role === 'admin' && user.password && user.password.length < 8) {
    throw new Error('كلمة مرور المشرف يجب أن تكون 8 أحرف على الأقل');
  }

  let expiresAt = user.expiresAt;
  if (!expiresAt && user.subscriptionDays && user.subscriptionDays > 0) {
    expiresAt = new Date(Date.now() + user.subscriptionDays * 24 * 60 * 60 * 1000).toISOString();
  }

  const newUser: UserAccount = {
    ...user,
    id: `user_${Date.now()}`,
    diagnosesCount: 0,
    createdAt: new Date().toISOString(),
    expiresAt,
    isOnline: false,
    loginAttempts: 0,
  };

  // حفظ في Supabase
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from('users').insert({
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        password: newUser.password,
        name: newUser.name,
        role: newUser.role,
        specialty: newUser.specialty,
        is_active: newUser.active,
        device_id: null, // ترك device_id null حتى يسجل الدخول لأول مرة
        expires_at: newUser.expiresAt,
        price: newUser.price,
      });

      if (error) {
        console.error('Error adding user to Supabase:', error);
        // نستمر رغم الخطأ لأن الحفظ المحلي سينجح
        // لكن نسجل التحذير
      }
    } catch (sbErr) {
      console.error('Exception adding user to Supabase:', sbErr);
      // نستمر رغم الخطأ لأن الحفظ المحلي سينجح
    }
  }

  // تحديث الـ cache
  usersCache = null;

  return newUser;
}

export async function deleteUser(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return false;
  }

  try {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return false;
    }

    // تحديث الـ cache
    usersCache = null;

    return true;
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return false;
  }
}

export async function toggleUserStatus(id: string): Promise<UserAccount | null> {
  const users = await getAllUsers();
  const user = users.find((u) => u.id === id);

  if (!user) return null;

  user.active = !user.active;

  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_active: user.active, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error toggling user status:', error);
      return null;
    }
  }

  // تحديث الـ cache
  usersCache = null;

  return user;
}

export async function extendSubscription(id: string, days: number): Promise<UserAccount | null> {
  const users = await getAllUsers();
  const user = users.find((u) => u.id === id);

  if (!user) return null;

  const currentExp = user.expiresAt ? new Date(user.expiresAt).getTime() : Date.now();
  const baseTime = currentExp > Date.now() ? currentExp : Date.now();
  const newExp = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

  user.expiresAt = newExp;
  user.active = true;

  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ expires_at: newExp, is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error extending subscription:', error);
      return null;
    }
  }

  // تحديث الـ cache
  usersCache = null;

  return user;
}

export async function terminateUserSession(id: string): Promise<boolean> {
  const users = await getAllUsers();
  const user = users.find((u) => u.id === id);

  if (!user) return false;

  user.activeSessionToken = undefined;
  user.isOnline = false;

  if (isSupabaseConfigured && supabaseAdmin) {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ device_id: null, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error terminating session:', error);
      return false;
    }
  }

  // تحديث الـ cache
  usersCache = null;

  return true;
}

export async function updateUserHeartbeat(
  username: string,
  sessionToken: string,
  deviceInfo?: string
): Promise<{ valid: boolean; user?: UserAccount; error?: string }> {
  const users = await getAllUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase().trim()
  );

  if (!user || !user.active) {
    return { valid: false, error: 'الحساب غير متاح أو تم تعطيله' };
  }

  // المشرف العام لا يتم طرده
  if (user.role === 'admin' || user.username.toLowerCase() === 'd3v1n_x9_admin') {
    user.activeSessionToken = sessionToken;
    user.lastSeenAt = new Date().toISOString();
    user.isOnline = true;
    if (deviceInfo) user.deviceInfo = deviceInfo;

    if (isSupabaseConfigured && supabaseAdmin) {
      await supabaseAdmin
        .from('users')
        .update({
          device_id: deviceInfo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    usersCache = null;
    return { valid: true, user };
  }

  // نظام جلسة واحدة نشطة - تحديث التوكن دائماً بدون فحص
  // السماح بالتبديل بين الأجهزة بحرية
  user.activeSessionToken = sessionToken;

  const sub = checkSubscription(user);
  if (sub.isExpired) {
    return { valid: false, error: 'انتهت فترة اشتراك الحساب' };
  }

  user.lastSeenAt = new Date().toISOString();
  user.isOnline = true;
  if (deviceInfo) user.deviceInfo = deviceInfo;

  // تحديث device_id في Supabase دائماً (نظام جلسة واحدة نشطة)
  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin
      .from('users')
      .update({
        device_id: deviceInfo || sessionToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
  }

  usersCache = null;
  return { valid: true, user };
}

export async function verifyLogin(
  username: string,
  password?: string,
  deviceInfo?: string
): Promise<{ user: UserAccount | null; error?: string }> {
  const users = await getAllUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase().trim()
  );

  if (!user) {
    return { user: null, error: 'اسم المستخدم غير موجود' };
  }

  // فحص القفل
  if (user.lockedUntil) {
    const lockTime = new Date(user.lockedUntil).getTime();
    if (Date.now() < lockTime) {
      const minutesLeft = Math.ceil((lockTime - Date.now()) / 60000);
      return {
        user: null,
        error: `⚠️ تم قفل الحساب مؤقتاً. يرجى الانتظار ${minutesLeft} دقيقة.`,
      };
    } else {
      user.lockedUntil = undefined;
      user.loginAttempts = 0;
      if (isSupabaseConfigured && supabaseAdmin) {
        await supabaseAdmin.from('users').update({
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);
      }
    }
  }

  const masterAdminPassword = process.env.ADMIN_PASSWORD;
  const isAdmin = user.role === 'admin' || user.username.toLowerCase() === 'd3v1n_x9_admin';

  if (user.password && password) {
    if (isAdmin && masterAdminPassword && (password === masterAdminPassword || password === user.password)) {
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
    } else if (user.password !== password) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        if (isSupabaseConfigured && supabaseAdmin) {
          await supabaseAdmin.from('users').update({
            updated_at: new Date().toISOString(),
          }).eq('id', user.id);
        }
        return {
          user: null,
          error: '⚠️ تم قفل الحساب مؤقتاً لمدة 30 دقيقة.',
        };
      }

      const remaining = 5 - user.loginAttempts;
      return {
        user: null,
        error: `كلمة المرور غير صحيحة. لديك ${remaining} محاولات متبقية.`,
      };
    } else {
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
    }
  }

  // فحص الاشتراك
  const sub = checkSubscription(user);
  if (sub.isExpired && user.role !== 'admin') {
    return { user: null, error: 'انتهت فترة اشتراك الحساب' };
  }

  // نظام جلسة واحدة نشطة (Single Active Session)
  // إذا فتح من جهاز جديد، يغلق الجهاز القديم تلقائياً بدون رسالة خطأ
  // لا يوجد فحص قفل - السماح بالتسجيل من أي جهاز مع تحديث deviceInfo

  // توليد session token جديد أو استخدام deviceInfo الموجود
  // للتوافق مع Supabase، نستخدم deviceInfo كـ sessionToken الموحد
  const sessionToken = deviceInfo || `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  user.activeSessionToken = sessionToken;
  user.deviceInfo = sessionToken; // توحيد deviceInfo مع activeSessionToken
  user.lastLoginAt = new Date().toISOString();
  user.lastSeenAt = new Date().toISOString();
  user.isOnline = true;

  if (isSupabaseConfigured && supabaseAdmin) {
    await supabaseAdmin.from('users').update({
      device_id: sessionToken, // حفظ كـ device_id في Supabase
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
  }

  usersCache = null;
  return { user };
}

export async function validateSessionToken(username: string, sessionToken: string): Promise<boolean> {
  if (!username || !sessionToken) {
    console.log('[Auth] Missing username or sessionToken');
    return false;
  }

  const users = await getAllUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase().trim() && u.active
  );

  if (!user) {
    console.log('[Auth] User not found or inactive:', username);
    return false;
  }

  // التحقق من التوكن - استخدم device_id كـ session token كما هو مخزن في Supabase
  const isValid = user.activeSessionToken === sessionToken || user.deviceInfo === sessionToken;

  console.log('[Auth] Session validation:', {
    username,
    isValid,
    hasActiveSessionToken: !!user.activeSessionToken,
    hasDeviceInfo: !!user.deviceInfo,
    providedToken: sessionToken.substring(0, 10) + '...',
    storedToken: user.activeSessionToken?.substring(0, 10) + '...',
    storedDeviceInfo: user.deviceInfo?.substring(0, 10) + '...'
  });

  return isValid;
}
