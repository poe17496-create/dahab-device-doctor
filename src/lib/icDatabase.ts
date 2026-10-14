import { supabaseAdmin } from './supabase';
import icData from '@/data/ic_database.json';
import fs from 'fs';
import path from 'path';

export interface DonorBoardMatch {
  brand: string;
  model: string;
  boardCode: string;
  category: string;
  roleOnBoard: string;
}

export interface ICRecord {
  partNumber: string;
  category: string;
  deviceFamily: string;
  function: string;
  compatibles: string[];
  commonSymptoms: string;
  diodeReadings: string;
  donorBoards?: DonorBoardMatch[];
}

let matrixCache: any[] | null = null;

function loadMatrix(): any[] {
  if (matrixCache) return matrixCache;
  try {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'hardwareSchematicsMatrix.json');
    if (fs.existsSync(filePath)) {
      matrixCache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      return matrixCache || [];
    }
  } catch (err) {
    console.error('Error loading hardwareSchematicsMatrix in icDatabase:', err);
  }
  matrixCache = [];
  return matrixCache;
}

/**
 * 🔍 محرك البحث في بدائل الآيسيهات وبوردات التشليح (IC & Scrap Board Donor Finder)
 * يبحث برقم الآيسي، أو باسم البوردة/الموديل، أو يُرجع أشهر الآيسيات عند ترك البحث فارغاً
 */
export async function searchICDatabase(query?: string): Promise<ICRecord[]> {
  const q = (query || '').toLowerCase().trim();

  // محاولة الاستعلام من Supabase أولاً إن كان مهيئاً
  if (supabaseAdmin) {
    try {
      return await searchICDatabaseSupabase(q);
    } catch (error) {
      console.warn('Supabase IC search fallback to local matrix:', error);
    }
  }

  // البحث المحلي في قاعدة الآيسيات ومصفوفة المخططات (859 بوردة)
  return searchICDatabaseLocal(q);
}

/**
 * استخراج بوردات التشليح المتطابقة مع آيسي معين من مصفوفة الـ 859 بوردة
 */
export function findDonorBoardsForIC(partNumber: string): DonorBoardMatch[] {
  if (!partNumber) return [];
  const matrix = loadMatrix();
  const key = partNumber.toLowerCase().trim();
  const matchedDonors: DonorBoardMatch[] = [];

  matrix.forEach((board) => {
    if (!board.mainChips) return;
    Object.entries(board.mainChips).forEach(([role, chipVal]) => {
      const chipStr = String(chipVal).toLowerCase();
      if (chipStr.includes(key) || key.includes(chipStr.split(' ')[0])) {
        if (matchedDonors.length < 20) {
          matchedDonors.push({
            brand: board.brand || 'معتمد',
            model: board.model,
            boardCode: board.boardCode || 'PCB-REF',
            category: board.category || 'electronics',
            roleOnBoard: `${role}: ${chipVal}`,
          });
        }
      }
    });
  });

  return matchedDonors;
}

/**
 * البحث في قاعدة الآيسيات عبر Supabase
 */
async function searchICDatabaseSupabase(query: string): Promise<ICRecord[]> {
  const q = query.toLowerCase().trim();

  let queryBuilder = supabaseAdmin.from('ic_database').select('*');

  if (q.length > 0) {
    queryBuilder = queryBuilder.or(`part_number.ilike.%${q}%,category.ilike.%${q}%,device_family.ilike.%${q}%,function.ilike.%${q}%`);
  }

  const { data: icDataRows, error: icError } = await queryBuilder.limit(25);

  if (icError) {
    throw icError;
  }

  // البحث عن بوردات التشليح في Supabase أو الماتريكس
  const baseResults: ICRecord[] = (icDataRows || []).map((item: any) => ({
    partNumber: item.part_number,
    category: item.category,
    deviceFamily: item.device_family,
    function: item.function,
    compatibles: item.compatibles || [],
    commonSymptoms: item.common_symptoms || '',
    diodeReadings: item.diode_readings || '',
    donorBoards: findDonorBoardsForIC(item.part_number),
  }));

  // إذا لم نجد نتائج وبحث المستخدم عن اسم بوردة أو آيسي غير مسجل، نبحث في الماتريكس المحلي
  if (baseResults.length === 0 && q.length > 0) {
    return searchICDatabaseLocal(q);
  }

  return baseResults;
}

/**
 * البحث المحلي الكامل (يدعم رقم الآيسي أو كود بوردة التشليح وموديل الجهاز)
 */
function searchICDatabaseLocal(query: string): ICRecord[] {
  const q = query.toLowerCase().trim();
  const allIcs = icData as ICRecord[];
  const matrix = loadMatrix();

  // 1. إذا كان البحث فارغاً: اعرض أشهر 25 آيسي شائعة في صيانة الموبايل واللابتوب مع بوردات التشليح
  if (!q) {
    return allIcs.slice(0, 25).map((rec) => ({
      ...rec,
      donorBoards: findDonorBoardsForIC(rec.partNumber),
    }));
  }

  // 2. البحث برقم الآيسي أو الفئة أو الوظيفة في قاعدة الآيسيات المباشرة
  const matchedIcs = allIcs.filter((item) => {
    return (
      item.partNumber.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.deviceFamily.toLowerCase().includes(q) ||
      item.function.toLowerCase().includes(q) ||
      item.compatibles.some((c) => c.toLowerCase().includes(q))
    );
  });

  const enrichedResults: ICRecord[] = matchedIcs.map((rec) => ({
    ...rec,
    donorBoards: findDonorBoardsForIC(rec.partNumber),
  }));

  // 3. البحث العكسي: هل بحث الفني عن "كود بوردة" أو "موديل جهاز تشليح" في ورشته؟ (مثل: LA-9104P أو iPhone 6 أو NM-A311)
  const matchedBoards = matrix.filter((b) => {
    const model = (b.model || '').toLowerCase();
    const code = (b.boardCode || '').toLowerCase();
    const brand = (b.brand || '').toLowerCase();
    return model.includes(q) || code.includes(q) || `${brand} ${model}`.includes(q);
  });

  if (matchedBoards.length > 0) {
    // استخراج جميع الآيسيات الموجودة على بوردة التشليح التي بحث عنها الفني
    matchedBoards.slice(0, 3).forEach((board) => {
      if (!board.mainChips) return;
      Object.entries(board.mainChips).forEach(([role, chipVal]) => {
        const chipName = String(chipVal).trim();
        // تجنب التكرار
        if (!enrichedResults.some((r) => r.partNumber.toLowerCase() === chipName.toLowerCase())) {
          // البحث عن بوردات أخرى تحمل نفس هذا الآيسي (بدائل التشليح)
          const otherDonors = findDonorBoardsForIC(chipName).filter((d) => d.boardCode !== board.boardCode);
          
          enrichedResults.push({
            partNumber: chipName,
            category: board.category === 'mobile' ? 'Mobile IC' : board.category === 'laptop' ? 'Laptop IC' : 'Motherboard IC',
            deviceFamily: `${board.brand} ${board.model} (${board.boardCode})`,
            function: `شريحة (${role}) على بوردة ${board.model}`,
            compatibles: otherDonors.map((d) => `${d.model} [${d.boardCode}]`),
            commonSymptoms: `فصل دائرة ${role}، شورت أو غياب جهد التشغيل على ملفات الدائرة.`,
            diodeReadings: 'قس الممانعة على ملف التغذية المحيط والمكثفات (المتوقع 0.350V - 0.480V بالدايود مود).',
            donorBoards: [
              {
                brand: board.brand,
                model: `${board.model} (البوردة الأصلية)`,
                boardCode: board.boardCode,
                category: board.category,
                roleOnBoard: role,
              },
              ...otherDonors,
            ],
          });
        }
      });
    });
  }

  // 4. إذا لم يطابق اسم آيسي ولا بوردة مباشرة، لكنه طابق شريحة في الماتريكس
  if (enrichedResults.length === 0) {
    const donors = findDonorBoardsForIC(q);
    if (donors.length > 0) {
      const first = donors[0];
      enrichedResults.push({
        partNumber: q.toUpperCase(),
        category: first.category === 'mobile' ? 'Mobile IC' : first.category === 'laptop' ? 'Laptop IC' : 'Electronics IC',
        deviceFamily: `${first.brand} & Multi-vendor`,
        function: `شريحة إلكترونية مستخدمة كـ (${first.roleOnBoard})`,
        compatibles: donors.map((d) => `${d.model} [${d.boardCode}]`),
        commonSymptoms: 'سخونة، سحب أمبير غير طبيعي على الباور سبلاي، أو فقدان الإشارة/الفولت الخاص بالدائرة.',
        diodeReadings: 'افحص خطوط الدخل والخرج بالدايود، وتأكد من عدم وجود قصر (Short to GND).',
        donorBoards: donors,
      });
    }
  }

  return enrichedResults;
}
