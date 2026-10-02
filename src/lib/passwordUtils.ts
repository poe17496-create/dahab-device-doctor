import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12; // عدد جولات التشفير (12 هو آمن ومتوازن)

/**
 * تشفير كلمة المرور باستخدام bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * التحقق من كلمة المرور
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * فحص قوة كلمة المرور
 * يرجع: { strong: boolean, score: 0-4, feedback: string[] }
 */
export function checkPasswordStrength(password: string): {
  strong: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { strong: false, score: 0, feedback: ['كلمة المرور مطلوبة'] };
  }

  // الطول
  if (password.length >= 8) score += 1;
  else feedback.push('يجب أن تكون 8 أحرف على الأقل');

  if (password.length >= 12) score += 1;

  // حروف كبيرة وصغيرة
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  else feedback.push('يجب أن تحتوي على حروف كبيرة وصغيرة');

  // أرقام
  if (/\d/.test(password)) score += 1;
  else feedback.push('يجب أن تحتوي على أرقام');

  // رموز خاصة
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('يجب أن تحتوي على رموز خاصة (!@#$%^&*)');

  return {
    strong: score >= 4,
    score: Math.min(score, 4),
    feedback,
  };
}

/**
 * توليد كلمة مرور قوية عشوائية
 */
export function generateStrongPassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = lowercase + uppercase + numbers + symbols;
  let password = '';

  // تأكد من وجود نوع واحد من كل نوع
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // إضافة باقي الأحرف عشوائياً
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // خلط الحروف
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
