/**
 * 🛠️ سجل حالات الورشة المؤكدة وخوارزمية التعلم بوزن النجاح (Success-Weighted Reinforcement Learning)
 * يحفظ الحالات التي تم إصلاحها فعلياً بالورشة، ويمنح الحلول الناجحة وزناً أعلى لتتصدر التشخيصات القادمة
 */

import fs from 'fs';
import path from 'path';

export interface WorkshopCase {
  id: string;
  model: string;
  boardCode?: string;
  category: 'mobile' | 'laptop' | 'desktop';
  symptom: string;
  measurements?: {
    bootCurrentmA?: string;
    diodeReadings?: Array<{ rail: string; value: string }>;
    hotspot?: string;
  };
  rootCause: string;
  solution: string;
  isResolved: boolean;
  successVotes: number;
  failureVotes: number;
  weight: number;
  technicianName?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_PATH = path.join(process.cwd(), 'src', 'data', 'workshop_cases.json');

// حالات أولية مؤكدة من واقع الورشة الهندسية
const SEED_CASES: WorkshopCase[] = [
  {
    id: 'case_seed_1',
    model: 'Apple iPhone 13 Pro Max',
    boardCode: '820-02384',
    category: 'mobile',
    symptom: 'شاشة بيضاء / خضراء كاملة (White/Green Screen of Death) مع استمرار استجابة اللمس واستقبال المكالمات',
    measurements: {
      bootCurrentmA: 'إقلاع طبيعي يتدرج من 0.080A حتى 0.950A',
      diodeReadings: [
        { rail: 'PP_VDD_MAIN', value: '0.385V' },
        { rail: 'PP_DISPLAY_BOOST', value: '0.420V' },
      ],
      hotspot: 'لا توجد سخونة ملحوظة',
    },
    rootCause: 'انقطاع مسار المزامنة وتغذية تردد التحديث العالي 120Hz (ProMotion Clock/Data) داخل فلاتة الشاشة نفسها',
    solution: 'عمل مسار تعويضي خارجي (Jumper Wire 0.02mm) معزول بقناع UV بين نقطة CLK_120HZ ومكثف التغذية أو فحص المقاومة المرتبطة.',
    isResolved: true,
    successVotes: 24,
    failureVotes: 1,
    weight: 23,
    technicianName: 'م. إسلام دهب',
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-10-20T14:30:00.000Z',
  },
  {
    id: 'case_seed_2',
    model: 'Apple iPhone 11',
    boardCode: '820-01535',
    category: 'mobile',
    symptom: 'فاصل باور تماماً مع سحب شورت صريح مباشر 5.000A فور توصيل الباور سبلاي',
    measurements: {
      bootCurrentmA: 'سحب أقصى فوري 5.000A على فولت 4.0V',
      diodeReadings: [
        { rail: 'PP_BATT_VCC', value: '0.420V' },
        { rail: 'PP_VDD_MAIN', value: '0.002V (Short Circuit)' },
      ],
      hotspot: 'سخونة شديدة فورية تذيب الرزينة على المكثف C3302 بجانب التيجريس',
    },
    rootCause: 'انهيار عازل مكثف السيراميك SMD رقم C3302 على خط التغذية الرئيسي PP_VDD_MAIN',
    solution: 'حقن تيار آمن 2.5V بحد أقصى 3A وتحديد المكثف الساخن بالحراري أو الرزينة، ثم رفعه وتنظيف المسار والقياس (الممانعة رجعت 0.390V).',
    isResolved: true,
    successVotes: 38,
    failureVotes: 0,
    weight: 38,
    technicianName: 'فريق ذهب سوفتوير',
    createdAt: '2026-02-15T12:00:00.000Z',
    updatedAt: '2026-10-21T09:15:00.000Z',
  },
  {
    id: 'case_seed_3',
    model: 'Dell Inspiron 15 3521 / 5521',
    boardCode: 'LA-9104P',
    category: 'laptop',
    symptom: 'اللابتوب فاصل باور نهائياً، وعند توصيل الشاحن تنطفئ لمبة الشاحن فوراً (Short on 19V)',
    measurements: {
      bootCurrentmA: 'شورت صريح على الـ DC Jack',
      diodeReadings: [
        { rail: '+19V_VIN', value: '0.001V' },
        { rail: '+3.3VALW', value: '0.380V' },
        { rail: '+5VALW', value: '0.410V' },
      ],
      hotspot: 'موسفيت الدخل PQ301 يسخن بشدة مع مكثف PC308',
    },
    rootCause: 'احتراق موسفيت الدخل الأول PQ301 من نوع N-Channel وتلف مكثف السيراميك الفلتر PC308',
    solution: 'استبدال الموسفيت PQ301 بموسفيت متوافق (مثل AON7408 أو TPCA8057) ورفع المكثف التالف، التأكد من زوال القصر واستقرار جهد 19V على الكويل.',
    isResolved: true,
    successVotes: 19,
    failureVotes: 1,
    weight: 18,
    technicianName: 'م. إسلام دهب',
    createdAt: '2026-03-01T15:00:00.000Z',
    updatedAt: '2026-10-18T18:00:00.000Z',
  },
  {
    id: 'case_seed_4',
    model: 'Apple MacBook Air M1 A2337',
    boardCode: '820-02020',
    category: 'laptop',
    symptom: 'سحب 5V فقط على التيستر ولا يرتفع إلى 20V (Stuck at 5V 0.040A) ولا يستجيب للباور',
    measurements: {
      bootCurrentmA: '5.1V / 0.040A ثابتة على شاحن الـ Type-C',
      diodeReadings: [
        { rail: 'PPBUS_AON', value: '0.005V (Short)' },
        { rail: 'PP3V3_G3H', value: '0.360V' },
      ],
      hotspot: 'مكثف سيراميك قرب آيسي الشحن ISL9240 يظهر حرارة طفيفة بالكاميرا الحرارية',
    },
    rootCause: 'شورت على خط PPBUS_AON الرئيسي ناتج عن مكثف تنعيم تالف يمنع رفع الجهد إلى 20V',
    solution: 'رفع المكثف التالف وتغيير آيسي الشحن U7000 (ISL9240) إن لزم، عودة الخط إلى 12.6V وارتفاع دخل الـ Type-C إلى 20V فوراً.',
    isResolved: true,
    successVotes: 29,
    failureVotes: 2,
    weight: 27,
    technicianName: 'مختبر الصيانة المتقدم',
    createdAt: '2026-04-12T11:20:00.000Z',
    updatedAt: '2026-10-22T13:40:00.000Z',
  },
  {
    id: 'case_seed_5',
    model: 'Samsung Galaxy S22 Ultra',
    boardCode: 'SM-S908B',
    category: 'mobile',
    symptom: 'الهاتف يعيد التشغيل كل 3 دقائق بالدقيقة والثانية وتظهر رسالة سخونة أو خلل حساس',
    measurements: {
      bootCurrentmA: 'إقلاع طبيعي ثم ريستارت مفاجئ عند 180 ثانية',
      diodeReadings: [
        { rail: 'I2C_SDA_SUB', value: '0.120V (تسريب)' },
        { rail: 'I2C_SCL_SUB', value: '0.510V' },
      ],
    },
    rootCause: 'تآكل وتمليح على مسار I2C في فلاتة الربط بين البوردة الرئيسية والبوردة السفلية (Sub-PBA FPC)',
    solution: 'استبدال فلاتة الربط الرئيسية الأصلية (Main FPC Ribbon) وتنظيف كونكتور البوردة السفلية بمادة الإيزوبروبيل.',
    isResolved: true,
    successVotes: 33,
    failureVotes: 1,
    weight: 32,
    technicianName: 'فريق ذهب سوفتوير',
    createdAt: '2026-05-08T16:45:00.000Z',
    updatedAt: '2026-10-23T11:00:00.000Z',
  },
];

let casesCache: WorkshopCase[] | null = null;

function ensureDataDirectory() {
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadWorkshopCases(): WorkshopCase[] {
  if (casesCache) return casesCache;

  ensureDataDirectory();
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      const data = fs.readFileSync(STORAGE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        casesCache = parsed;
        return casesCache;
      }
    }
    // كتابة الحالات الأولية إذا لم يكن الملف موجوداً
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(SEED_CASES, null, 2), 'utf-8');
    casesCache = SEED_CASES;
    return casesCache;
  } catch (error) {
    console.error('Error loading workshop_cases.json:', error);
    casesCache = SEED_CASES;
    return casesCache;
  }
}

export function saveWorkshopCasesToDisk(cases: WorkshopCase[]) {
  ensureDataDirectory();
  try {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(cases, null, 2), 'utf-8');
    casesCache = cases;
  } catch (error) {
    console.error('Error saving workshop_cases.json:', error);
  }
}

/**
 * إضافة حالة مؤكدة جديدة من الورشة
 */
export function addWorkshopCase(caseData: {
  model: string;
  boardCode?: string;
  category: 'mobile' | 'laptop' | 'desktop';
  symptom: string;
  measurements?: {
    bootCurrentmA?: string;
    diodeReadings?: Array<{ rail: string; value: string }>;
    hotspot?: string;
  };
  rootCause: string;
  solution: string;
  isResolved?: boolean;
  technicianName?: string;
}): WorkshopCase {
  const cases = loadWorkshopCases();
  const now = new Date().toISOString();
  
  const newCase: WorkshopCase = {
    id: `case_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    model: caseData.model.trim(),
    boardCode: caseData.boardCode?.trim(),
    category: caseData.category,
    symptom: caseData.symptom.trim(),
    measurements: caseData.measurements,
    rootCause: caseData.rootCause.trim(),
    solution: caseData.solution.trim(),
    isResolved: caseData.isResolved ?? true,
    successVotes: 1,
    failureVotes: 0,
    weight: 5, // وزن بدئي تشجيعي للحالات المؤكدة
    technicianName: caseData.technicianName || 'فني معتمد بالورشة',
    createdAt: now,
    updatedAt: now,
  };

  cases.unshift(newCase);
  saveWorkshopCasesToDisk(cases);
  return newCase;
}

/**
 * التصويت على نجاح أو فشل الحل (Reinforcement Weighting)
 */
export function voteWorkshopCase(caseId: string, isSuccess: boolean): WorkshopCase | null {
  const cases = loadWorkshopCases();
  const target = cases.find((c) => c.id === caseId);
  if (!target) return null;

  if (isSuccess) {
    target.successVotes += 1;
    target.weight += 1; // زيادة الوزن
  } else {
    target.failureVotes += 1;
    target.weight = Math.max(0, target.weight - 1); // خفض الوزن
  }

  target.updatedAt = new Date().toISOString();
  saveWorkshopCasesToDisk(cases);
  return target;
}

/**
 * البحث المرجح في حالات الورشة مع الفصل الصارم للفئات
 */
export function searchWorkshopCases(
  query: string,
  category?: 'mobile' | 'laptop' | 'desktop',
  deviceModel?: string
): WorkshopCase[] {
  const cases = loadWorkshopCases();
  if (!cases.length) return [];

  const fullQuery = `${deviceModel || ''} ${query}`.toLowerCase();
  const queryTokens = fullQuery.split(/[\s,._\-\/]+/).filter((t) => t.length > 1);

  const scored = cases
    .filter((c) => {
      // عزل صارم: لا نخلط بين اللابتوب والموبايل نهائياً
      if (category && c.category !== category) {
        return false;
      }
      return true;
    })
    .map((c) => {
      let score = 0;
      const modelLower = c.model.toLowerCase();
      const symptomLower = c.symptom.toLowerCase();
      const causeLower = c.rootCause.toLowerCase();
      const codeLower = (c.boardCode || '').toLowerCase();

      // مطابقة الموديل المباشر
      if (deviceModel && (modelLower.includes(deviceModel.toLowerCase()) || deviceModel.toLowerCase().includes(modelLower))) {
        score += 25;
      }

      queryTokens.forEach((t) => {
        if (modelLower.includes(t)) score += 8;
        if (codeLower.includes(t)) score += 15;
        if (symptomLower.includes(t)) score += 6;
        if (causeLower.includes(t)) score += 4;
      });

      // دمج وزن النجاح الهندسي: كل تصويت نجاح يرفع الأولوية
      const finalScore = score * 0.6 + c.weight * 0.4;

      return { item: c, finalScore };
    });

  return scored
    .filter((s) => s.finalScore > 2)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 5)
    .map((s) => s.item);
}
