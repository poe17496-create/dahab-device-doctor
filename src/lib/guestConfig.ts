// إعدادات الزائر - الأقسام المسموحة والقيود
import type { MasterTab } from '@/app/page';

/**
 * الأقسام المسموحة للزائر
 * يمكن للزائر استخدام هذه الأقسام فقط
 */
export const GUEST_ALLOWED_TABS: MasterTab[] = [
  'diagnosis',    // التشخيص الذكي
  'ai-chat',      // مساعد الذكاء الاصطناعي (الشات)
  'boardview',    // معمل البوردفيو والمسارات
];

/**
 * التحقق مما إذا كان القسم مسموحاً للزائر
 */
export function isTabAllowedForGuest(tab: MasterTab): boolean {
  return GUEST_ALLOWED_TABS.includes(tab);
}

/**
 * الحصول على رسالة القفل للزائر
 */
export function getGuestLockMessage(tab: MasterTab): string {
  const tabNames: Record<MasterTab, string> = {
    diagnosis: 'التشخيص الذكي',
    memory: 'ذاكرة الأجهزة والمحادثات',
    'panic-log': 'محلل ملفات البانيك',
    'safe-injection': 'حاسبة الفولت الآمن للحقن',
    'ic-encyclopedia': 'موسوعة الآيسيهات والبدائل',
    checklist: 'قائمة الفحص الهندسي',
    references: 'المراجع الهندسية',
    integration: 'تقارير التكامل',
    'ai-chat': 'مساعد الذكاء الاصطناعي',
    ecosystem: 'برمجيات دهب سوفت وير',
    boardview: 'معمل البوردفيو والمسارات',
  };

  return `هذه الميزة متاحة للفنيين المعتمدين فقط 🔒

أنت تستخدم وضع الزائر. سجّل الدخول بحساب فني للوصول لكل أدوات منظومة دهب دكتور.

القسم: ${tabNames[tab] || tab}`;
}
