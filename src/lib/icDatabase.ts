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

export function searchICDatabase(query: string): ICRecord[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();

  // 1. البحث في قاعدة الآيسيات الأساسية
  const baseResults: ICRecord[] = (icData as ICRecord[]).filter((item) => {
    return (
      item.partNumber.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.deviceFamily.toLowerCase().includes(q) ||
      item.function.toLowerCase().includes(q) ||
      item.compatibles.some((c) => c.toLowerCase().includes(q))
    );
  });

  // 2. البحث في مصفوفة الـ 859 بوردة ومخطط عن بوردات التشليح (Donor Boards)
  const matrix = loadMatrix();
  const donorMap: Record<string, DonorBoardMatch[]> = {};

  // البحث في المخططات لكل نتيجة وربطها ببوردات التشليح
  matrix.forEach((board) => {
    if (!board.mainChips) return;
    Object.entries(board.mainChips).forEach(([role, chipName]) => {
      const chipStr = String(chipName).toLowerCase();
      if (chipStr.includes(q)) {
        if (!donorMap[q]) donorMap[q] = [];
        if (donorMap[q].length < 15) {
          donorMap[q].push({
            brand: board.brand,
            model: board.model,
            boardCode: board.boardCode,
            category: board.category,
            roleOnBoard: `${role}: ${chipName}`,
          });
        }
      }
    });
  });

  // إرفاق بوردات التشليح بالنتائج الأساسية
  const enrichedResults = baseResults.map((rec) => {
    const partKey = rec.partNumber.toLowerCase();
    const matchedDonors: DonorBoardMatch[] = [];

    matrix.forEach((board) => {
      if (!board.mainChips) return;
      Object.entries(board.mainChips).forEach(([role, chipName]) => {
        const chipStr = String(chipName).toLowerCase();
        if (chipStr.includes(partKey) || partKey.includes(chipStr.split(' ')[0])) {
          if (matchedDonors.length < 15) {
            matchedDonors.push({
              brand: board.brand,
              model: board.model,
              boardCode: board.boardCode,
              category: board.category,
              roleOnBoard: `${role}: ${chipName}`,
            });
          }
        }
      });
    });

    return {
      ...rec,
      donorBoards: matchedDonors.length > 0 ? matchedDonors : donorMap[q],
    };
  });

  // إذا لم يكن الآيسي مسجلاً في ic_database لكنه موجود في بوردات المخططات الـ 859:
  if (enrichedResults.length === 0 && donorMap[q] && donorMap[q].length > 0) {
    const firstDonor = donorMap[q][0];
    enrichedResults.push({
      partNumber: query.toUpperCase(),
      category: firstDonor.category === 'mobile' ? 'Mobile IC' : firstDonor.category === 'laptop' ? 'Laptop IC' : 'Desktop/GPU IC',
      deviceFamily: `${firstDonor.brand} & Multi-vendor`,
      function: `شريحة إلكترونية مستخدمة كـ (${firstDonor.roleOnBoard})`,
      compatibles: donorMap[q].map(d => `${d.model} [${d.boardCode}]`),
      commonSymptoms: 'فصل باور، تذبذب سحب الأمبير، أو فقدان الجهد المنظم الخاص بالدائرة',
      diodeReadings: 'قس الممانعة على أطراف الملفات والمكثفات المحيطة لتحديد الشورت (0.350V - 0.500V متوقع)',
      donorBoards: donorMap[q],
    });
  }

  return enrichedResults;
}
