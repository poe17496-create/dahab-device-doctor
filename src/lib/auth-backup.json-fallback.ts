import fs from 'fs';
import path from 'path';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'technician';
  specialty?: string;
  password?: string;
  passwordHash?: string; // كلمة المرور المشفرة (للاستخدام المستقبلي)
  active: boolean;
  diagnosesCount: number;
  createdAt: string;
  activeSessionToken?: string;
  lastLoginAt?: string;
  lastSeenAt?: string;
  isOnline?: boolean;
  deviceInfo?: string;
  expiresAt?: string; // تاريخ انتهاء الصلاحية أو فارغ لغير محدود
  subscriptionDays?: number;
  price?: number;
  loginAttempts?: number; // عدد محاولات الدخول الفاشلة
  lockedUntil?: string; // تاريخ فتح القفل
}

const BASE_DIR = process.env.VERCEL ? '/tmp' : process.cwd();
const DATA_DIR = path.join(BASE_DIR, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const DEFAULT_USERS: UserAccount[] = [
  {
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
    expiresAt: undefined, // غير محدود
  },
];

const DELETED_FILE = path.join(DATA_DIR, 'deleted_users.json');
let inMemoryDeletedSet = new Set<string>();

export function getDeletedUserIds(): Set<string> {
  try {
    if (fs.existsSync(DELETED_FILE)) {
      const data = JSON.parse(fs.readFileSync(DELETED_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        data.forEach((id: string) => inMemoryDeletedSet.add(id));
      }
    }
  } catch (e) {}
  return inMemoryDeletedSet;
}

function recordDeletedUserId(idOrUsername: string) {
  inMemoryDeletedSet.add(idOrUsername.toLowerCase());
  try {
    ensureUsersFile();
    fs.writeFileSync(DELETED_FILE, JSON.stringify(Array.from(inMemoryDeletedSet)), 'utf-8');
  } catch (e) {}
}

function ensureUsersFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('Error ensuring users file:', e);
  }
}

export function getAllUsers(): UserAccount[] {
  ensureUsersFile();
  const deletedSet = getDeletedUserIds();
  try {
    if (!fs.existsSync(USERS_FILE)) return DEFAULT_USERS;
    const content = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed: UserAccount[] = JSON.parse(content);
    return parsed.filter(
      (u) =>
        !deletedSet.has(u.id.toLowerCase()) &&
        !deletedSet.has(u.username.toLowerCase())
    );
  } catch (err) {
    console.error('Error reading users file:', err);
    return DEFAULT_USERS;
  }
}

export function saveAllUsers(users: UserAccount[]): boolean {
  ensureUsersFile();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing users file:', err);
    return false;
  }
}

/**
 * فحص سريان اشتراك المستخدم وحساب الأيام المتبقية
 */
export function checkSubscription(user: UserAccount): { isExpired: boolean; daysRemaining: number } {
  if (!user.expiresAt || user.role === 'admin') {
    return { isExpired: false, daysRemaining: 9999 }; // غير محدود
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

/**
 * إضافة مستخدم جديد مع تحديد مدة الصلاحية
 */
export function addUser(
  user: Omit<UserAccount, 'id' | 'createdAt' | 'diagnosesCount'> & { subscriptionDays?: number }
): UserAccount {
  const users = getAllUsers();

  // فحص قوة كلمة المرور
  if (user.password && user.password.length < 8) {
    throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
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
  users.push(newUser);
  saveAllUsers(users);
  return newUser;
}

export function deleteUser(id: string): boolean {
  recordDeletedUserId(id);
  let users = getAllUsers();
  const initialLength = users.length;
  users = users.filter((u) => u.id !== id && u.username.toLowerCase() !== id.toLowerCase());
  if (users.length !== initialLength) {
    saveAllUsers(users);
    return true;
  }
  // حتى إذا كان غير موجود بالملف، يتم تسجيله بالمقبرة لعدم عودته
  return true;
}

export function toggleUserStatus(id: string): UserAccount | null {
  const users = getAllUsers();
  const user = users.find((u) => u.id === id);
  if (user) {
    user.active = !user.active;
    saveAllUsers(users);
    return user;
  }
  return null;
}

/**
 * تمديد اشتراك مستخدم بعدد أيام إضافية
 */
export function extendSubscription(id: string, days: number): UserAccount | null {
  const users = getAllUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return null;

  const currentExp = user.expiresAt ? new Date(user.expiresAt).getTime() : Date.now();
  const baseTime = currentExp > Date.now() ? currentExp : Date.now();
  const newExp = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

  user.expiresAt = newExp;
  user.active = true;
  saveAllUsers(users);
  return user;
}

/**
 * إنهاء جلسة مستخدم عن بعد من لوحة التحكم (Kick/Terminate Session)
 */
export function terminateUserSession(id: string): boolean {
  const users = getAllUsers();
  const user = users.find((u) => u.id === id);
  if (user) {
    user.activeSessionToken = undefined;
    user.isOnline = false;
    saveAllUsers(users);
    return true;
  }
  return false;
}

/**
 * تحديث حالة النشاط الحية (Heartbeat) وتأكيد جلسة الجهاز الواحد
 */
export function updateUserHeartbeat(
  username: string,
  sessionToken: string,
  deviceInfo?: string
): { valid: boolean; user?: UserAccount; error?: string } {
  const users = getAllUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase().trim());
  if (!user || !user.active) {
    return { valid: false, error: 'الحساب غير متاح أو تم تعطيله' };
  }

  // المشرف العام (المهندس إسلام دهب) لا يتم طرده بأي حال من الأحوال
  if (user.role === 'admin' || user.username.toLowerCase() === 'd3v1n_x9_admin') {
    user.activeSessionToken = sessionToken;
    user.lastSeenAt = new Date().toISOString();
    user.isOnline = true;
    if (deviceInfo) user.deviceInfo = deviceInfo;
    saveAllUsers(users);
    return { valid: true, user };
  }

  // إذا لم يكن هناك توكن مسجل بعد على السيرفر، اعتمده مباشرة
  if (!user.activeSessionToken) {
    user.activeSessionToken = sessionToken;
  } else if (user.activeSessionToken !== sessionToken) {
    return { valid: false, error: 'تم تسجيل الدخول إلى هذا الحساب من جهاز آخر، وتم إنهاء هذه الجلسة حفاظاً على الأمان.' };
  }

  const sub = checkSubscription(user);
  if (sub.isExpired) {
    return { valid: false, error: 'انتهت فترة اشتراك الحساب، يرجى مراجعة المشرف العام لتجديد الصلاحية.' };
  }

  user.lastSeenAt = new Date().toISOString();
  user.isOnline = true;
  if (deviceInfo) user.deviceInfo = deviceInfo;
  saveAllUsers(users);
  return { valid: true, user };
}

/**
 * التحقق من تسجيل الدخول وتطبيق قاعدة جهاز واحد فقط (Single-Device Enforcement)
 * وحظر الحسابات منتهية الاشتراك
 * وتتبع محاولات الدخول الفاشلة
 */
export function verifyLogin(
  username: string,
  password?: string,
  deviceInfo?: string
): { user: UserAccount | null; error?: string } {
  const users = getAllUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase().trim()
  );

  if (!user) {
    return { user: null, error: 'اسم المستخدم غير موجود' };
  }

  // إجبار تسجيل الخروج إذا كان المستخدم يستخدم بيانات قديمة
  if (username.toLowerCase() === 'dahab' || password === 'dahab2026') {
    // إنهاء جميع الجلسات القديمة
    users.forEach(u => {
      if (u.username.toLowerCase() === 'dahab') {
        u.activeSessionToken = undefined;
        u.isOnline = false;
      }
    });
    saveAllUsers(users);
    return { user: null, error: '⚠️ تم تحديث بيانات الأمان. يرجى استخدام البيانات الجديدة للدخول.' };
  }

  // فحص إذا كان الحساب مقفول بسبب محاولات كثيرة فاشلة
  if (user.lockedUntil) {
    const lockTime = new Date(user.lockedUntil).getTime();
    if (Date.now() < lockTime) {
      const minutesLeft = Math.ceil((lockTime - Date.now()) / 60000);
      return {
        user: null,
        error: `⚠️ تم قفل الحساب مؤقتاً بسبب محاولات دخول خاطئة متكررة. يرجى الانتظار ${minutesLeft} دقيقة والمحاولة مرة أخرى.`,
      };
    } else {
      // فتح القفل تلقائياً بعد انتهاء المدة
      user.lockedUntil = undefined;
      user.loginAttempts = 0;
      saveAllUsers(users);
    }
  }

  const masterAdminPassword = process.env.ADMIN_PASSWORD;
  const isAdmin = user.role === 'admin' || user.username.toLowerCase() === 'd3v1n_x9_admin';

  if (user.password && password) {
    if (isAdmin && masterAdminPassword && (password === masterAdminPassword || password === user.password)) {
      // كلمة سر الأدمن صحيحة - تصفير عداد المحاولات
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
    } else if (user.password !== password) {
      // كلمة المرور خاطئة - زيادة عداد المحاولات
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // بعد 5 محاولات فاشلة، قفل الحساب لمدة 30 دقيقة
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        saveAllUsers(users);
        return {
          user: null,
          error: '⚠️ تم قفل الحساب مؤقتاً لمدة 30 دقيقة بسبب محاولات دخول خاطئة متكررة. يرجى المحاولة لاحقاً.',
        };
      }

      saveAllUsers(users);
      const remaining = 5 - user.loginAttempts;
      return {
        user: null,
        error: `كلمة المرور غير صحيحة. لديك ${remaining} محاولات متبقية قبل قفل الحساب.`,
      };
    } else {
      // كلمة المرور صحيحة - تصفير عداد المحاولات
      user.loginAttempts = 0;
      user.lockedUntil = undefined;
    }
  }

  // فحص مدة الصلاحية والاشتراك
  const sub = checkSubscription(user);
  if (sub.isExpired && user.role !== 'admin') {
    return { user: null, error: 'انتهت فترة اشتراك الحساب، يرجى التواصل مع المشرف العام لتجديد الاشتراك.' };
  }

  // نظام قفل الجهاز الوحيد - منع الدخول المتعدد لنفس الحساب
  if (user.deviceInfo && user.deviceInfo !== deviceInfo && user.isOnline) {
    // إذا كان المستخدم متصل بالفعل من جهاز آخر
    const timeSinceLastSeen = user.lastSeenAt
      ? Date.now() - new Date(user.lastSeenAt).getTime()
      : Infinity;

    // إذا كان النشاط خلال آخر 5 دقائق، اعتباره متصل حالياً
    if (timeSinceLastSeen < 5 * 60 * 1000) {
      return {
        user: null,
        error: '⚠️ هذا الحساب مسجل الدخول حالياً من جهاز آخر. يرجى التأكد من أنك قمت بتسجيل الخروج من الجهاز الآخر أولاً، أو انتظر حتى يخرج المستخدم الآخر.',
      };
    }
  }

  // توليد رمز جلسة جديد فريد وطرد أي جهاز سابق فوراً
  const newSessionToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  user.activeSessionToken = newSessionToken;
  user.lastLoginAt = new Date().toISOString();
  user.lastSeenAt = new Date().toISOString();
  user.isOnline = true;
  if (deviceInfo) user.deviceInfo = deviceInfo;

  // إنهاء جميع الجلسات القديمة للمستخدمين الآخرين عند استخدام البيانات الجديدة
  if (username.toLowerCase() === 'd3v1n_x9_admin') {
    users.forEach(u => {
      if (u.username.toLowerCase() === 'dahab') {
        u.activeSessionToken = undefined;
        u.isOnline = false;
      }
    });
  }

  saveAllUsers(users);

  return { user };
}

/**
 * فحص سريان جلسة المستخدم الحالية
 */
export function validateSessionToken(username: string, sessionToken: string): boolean {
  const users = getAllUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase().trim() && u.active
  );
  if (!user) return false;
  return user.activeSessionToken === sessionToken;
}
