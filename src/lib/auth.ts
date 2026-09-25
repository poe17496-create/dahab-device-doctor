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
}

const BASE_DIR = process.env.VERCEL ? '/tmp' : process.cwd();
const DATA_DIR = path.join(BASE_DIR, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user_admin',
    username: 'dahab',
    name: 'المهندس إسلام دهب (المشرف العام ومطور المنظومة)',
    email: 'dahab@doctor.com',
    role: 'admin',
    specialty: 'كبير مهندسي الإلكترونيات والميكروسولديرنج ومطور أنظمة دهب',
    password: 'dahab2026',
    active: true,
    diagnosesCount: 185,
    createdAt: '2026-01-01T00:00:00.000Z',
    isOnline: true,
    lastSeenAt: new Date().toISOString(),
    expiresAt: undefined, // غير محدود
  },
  {
    id: 'user_tech1',
    username: 'tech_ahmed',
    name: 'م. أحمد مصطفى',
    email: 'ahmed@doctor.com',
    role: 'technician',
    specialty: 'صيانة الآيفون وسواب المعالجات A12-A17',
    password: '123456',
    active: true,
    diagnosesCount: 64,
    createdAt: '2026-02-15T00:00:00.000Z',
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 يوم متبقية
    subscriptionDays: 60,
  },
  {
    id: 'user_tech2',
    username: 'tech_mohamed',
    name: 'م. محمد كمال',
    email: 'mohamed@doctor.com',
    role: 'technician',
    specialty: 'صيانة اللابتوب والماك بوك وكروت الشاشة',
    password: '123456',
    active: true,
    diagnosesCount: 42,
    createdAt: '2026-03-01T00:00:00.000Z',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 يوم متبقية
    subscriptionDays: 30,
  },
];

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
  try {
    if (!fs.existsSync(USERS_FILE)) return DEFAULT_USERS;
    const content = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(content);
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
  };
  users.push(newUser);
  saveAllUsers(users);
  return newUser;
}

export function deleteUser(id: string): boolean {
  let users = getAllUsers();
  const initialLength = users.length;
  users = users.filter((u) => u.id !== id);
  if (users.length !== initialLength) {
    saveAllUsers(users);
    return true;
  }
  return false;
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
  if (user.activeSessionToken && user.activeSessionToken !== sessionToken) {
    return { valid: false, error: 'تم تسجيل الدخول إلى هذا الحساب من جهاز آخر، وتم إنهاء هذه الجلسة حفاظاً على الأمان.' };
  }
  const sub = checkSubscription(user);
  if (sub.isExpired && user.role !== 'admin') {
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
  if (!user.active) {
    return { user: null, error: 'هذا الحساب معطل حالياً من قبل المشرف العام' };
  }
  if (user.password && password && user.password !== password) {
    return { user: null, error: 'كلمة المرور غير صحيحة' };
  }

  // فحص مدة الصلاحية والاشتراك
  const sub = checkSubscription(user);
  if (sub.isExpired && user.role !== 'admin') {
    return { user: null, error: 'انتهت فترة اشتراك الحساب، يرجى التواصل مع المشرف العام لتجديد الاشتراك.' };
  }

  // توليد رمز جلسة جديد فريد وطرد أي جهاز سابق فوراً
  const newSessionToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  user.activeSessionToken = newSessionToken;
  user.lastLoginAt = new Date().toISOString();
  user.lastSeenAt = new Date().toISOString();
  user.isOnline = true;
  if (deviceInfo) user.deviceInfo = deviceInfo;

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
