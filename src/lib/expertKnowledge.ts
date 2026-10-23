import fs from 'fs';
import path from 'path';
import { searchWorkshopCases, WorkshopCase } from './workshopCases';

export interface ExpertPattern {
  symptom: string;
  solution: string;
  category: string;
}

export interface HardwareMatrixItem {
  id: string;
  brand: string;
  model: string;
  boardCode: string;
  category: 'mobile' | 'laptop' | 'desktop' | 'gpu';
  mainChips: Record<string, string>;
  powerRails: { rail: string; voltage: string; diodeMode: string; safeInjection?: string }[];
  commonFaults: { symptom: string; cause: string; solution: string }[];
}

export interface MatchedSchematicContext {
  deviceTitle?: string;
  deviceModel?: string;
  boardCode?: string;
  mainChips?: Record<string, string>;
  relevantNets?: { name: string; voltage: string; diodeMode: string; safeInjection?: string; description?: string }[];
  relevantParts?: { name: string; role: string; commonFault: string }[];
  commonFaults?: { symptom: string; cause: string; solution: string }[];
}

export interface ComprehensiveKnowledgeResult {
  expertPatterns: ExpertPattern[];
  schematicContext?: MatchedSchematicContext;
}

let patternsCache: ExpertPattern[] | null = null;
let hardwareMatrixCache: HardwareMatrixItem[] | null = null;

// تحميل مصفوفة المخططات الضخمة من ملف hardwareSchematicsMatrix.json
// Added loading flag to prevent blocking
let hardwareMatrixLoading = false;
function loadHardwareMatrix(): HardwareMatrixItem[] {
  if (hardwareMatrixCache) return hardwareMatrixCache;
  if (hardwareMatrixLoading) return []; // Return empty while loading

  hardwareMatrixLoading = true;
  try {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'hardwareSchematicsMatrix.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      hardwareMatrixCache = JSON.parse(data);
      hardwareMatrixLoading = false;
      return hardwareMatrixCache || [];
    }
  } catch (error) {
    console.error('Error loading hardwareSchematicsMatrix.json:', error);
  }
  hardwareMatrixLoading = false;
  hardwareMatrixCache = [];
  return [];
}

// تحميل أنماط الصيانة من ملف JSON مع كاش سريع في الذاكرة
// Added loading flag to prevent blocking
let patternsLoading = false;
function loadPatterns(): ExpertPattern[] {
  if (patternsCache) return patternsCache;
  if (patternsLoading) return []; // Return empty while loading

  patternsLoading = true;
  try {
    const filePath = path.join(process.cwd(), 'expert_patterns.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      patternsCache = JSON.parse(data);
      patternsLoading = false;
      return patternsCache || [];
    }
  } catch (error) {
    console.error('Error loading expert_patterns.json:', error);
  }
  patternsLoading = false;
  patternsCache = [];
  return [];
}

// بحث متقدم وسريع في الأنماط المرجعية مع عزل صارم للتخصص
export function findRelevantPatterns(symptom: string, category?: string): ExpertPattern[] {
  const patterns = loadPatterns();
  if (!patterns.length) return [];

  const queryTerms = symptom.toLowerCase().split(/[\s,._\-\/]+/).filter(t => t.length > 1);
  if (!queryTerms.length) return [];

  const targetCat = mapSpecialtyToCategory(category);

  const scoredPatterns = patterns.map(pattern => {
    const patternCategory = (pattern.category || '').toLowerCase();

    // 🛡️ عزل صارم 100%: إذا كان الجهاز لابتوب نمنع تماماً أنماط الموبايل، والعكس بالعكس
    if (targetCat === 'laptop') {
      if (patternCategory.includes('mobile') || patternCategory.includes('phone') || patternCategory.includes('iphone') || patternCategory.includes('samsung')) {
        return { pattern, score: -100 };
      }
    } else if (targetCat === 'mobile') {
      if (patternCategory.includes('laptop') || patternCategory.includes('macbook') || patternCategory.includes('motherboard') || patternCategory.includes('dell')) {
        return { pattern, score: -100 };
      }
    }

    let score = 0;
    const patternSymptom = (pattern.symptom || '').toLowerCase();
    const patternSolution = (pattern.solution || '').toLowerCase();
    
    // مكافأة مطابقة الفئة
    if (category && pattern.category && pattern.category.toLowerCase().includes(category.toLowerCase())) {
      score += 4;
    }

    queryTerms.forEach(term => {
      if (patternSymptom.includes(term)) score += 3;
      if (patternSolution.includes(term)) score += 1.5;
    });

    return { pattern, score };
  });

  return scoredPatterns
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(p => p.pattern);
}

// تعيين فئة التخصص لمصفوفة المخططات
function mapSpecialtyToCategory(specialty?: string): 'laptop' | 'mobile' | 'desktop' | 'gpu' | undefined {
  if (!specialty) return undefined;
  const s = specialty.toLowerCase();
  if (s.includes('laptop') || s.includes('macbook') || s.includes('لابتوب') || s.includes('ماك')) return 'laptop';
  if (s.includes('mobile') || s.includes('phone') || s.includes('موبايل') || s.includes('هاتف') || s.includes('ios') || s.includes('android')) return 'mobile';
  if (s.includes('desktop') || s.includes('pc') || s.includes('كمبيوتر') || s.includes('tv') || s.includes('power')) return 'desktop';
  return undefined;
}

// بحث متقدم وشامل في مصفوفة المخططات (Hardware Schematics Matrix) مع عزل صارم للفئات
export function findRelevantSchematics(query: string, deviceModel?: string, specialty?: string): MatchedSchematicContext | undefined {
  const matrix = loadHardwareMatrix();
  const targetCategory = mapSpecialtyToCategory(specialty);
  const fullQuery = `${deviceModel || ''} ${query || ''}`.toLowerCase();
  const queryTerms = fullQuery.split(/[\s,._\-\/]+/).filter(t => t.length > 1);

  if (matrix.length > 0) {
    let bestMatch: HardwareMatrixItem | null = null;
    let bestScore = 0;

    matrix.forEach(item => {
      // عزل صارم: إذا كان التخصص لابتوب، لا نطابق أبداً موبايل، والعكس بالعكس
      if (targetCategory && item.category !== targetCategory) {
        // نسمح فقط بـ desktop مع laptop إذا لم نجد تطابق
        if (!(targetCategory === 'laptop' && item.category === 'desktop')) {
          return;
        }
      }

      let score = 0;
      const modelLower = item.model.toLowerCase();
      const boardLower = (item.boardCode || '').toLowerCase();
      const brandLower = item.brand.toLowerCase();

      // مكافأة التطابق التام مع الفئة المطلوبة
      if (targetCategory && item.category === targetCategory) {
        score += 15;
      }

      if (deviceModel && (modelLower.includes(deviceModel.toLowerCase()) || deviceModel.toLowerCase().includes(modelLower))) {
        score += 30;
      }

      queryTerms.forEach(term => {
        if (modelLower.includes(term)) score += 5;
        if (boardLower.includes(term)) score += 10; // أولوية قصوى لكود البوردة
        if (brandLower === term) score += 3;
      });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    });

    if (bestMatch && bestScore >= 5) {
      const match: HardwareMatrixItem = bestMatch;
      return {
        deviceTitle: match.model,
        deviceModel: match.model,
        boardCode: match.boardCode,
        mainChips: match.mainChips,
        relevantNets: match.powerRails.map(r => ({
          name: r.rail,
          voltage: r.voltage,
          diodeMode: r.diodeMode,
          safeInjection: r.safeInjection,
        })),
        commonFaults: match.commonFaults,
      };
    }
  }

  return undefined;
}

// دمج المعرفة الفائقة في كائن واحد سريع ومضغوط
export function getCompressedExpertKnowledge(query: string, specialty?: string, deviceModel?: string): ComprehensiveKnowledgeResult {
  const expertPatterns = findRelevantPatterns(query, specialty);
  const schematicContext = findRelevantSchematics(query, deviceModel, specialty);

  return {
    expertPatterns,
    schematicContext,
  };
}

// صياغة سياق الذكاء الاصطناعي بدقة متناهية وبأقل استهلاك للتوكنز مع أولوية سجل حالات الورشة
export function buildExpertPromptContext(query: string, specialty?: string, deviceModel?: string): string {
  const { expertPatterns, schematicContext } = getCompressedExpertKnowledge(query, specialty, deviceModel);
  const targetCategory = mapSpecialtyToCategory(specialty);

  // 1. البحث في سجل الحالات المؤكدة من الورشة بوزن النجاح
  const workshopCases = searchWorkshopCases(query, targetCategory as any, deviceModel);

  let context = '';

  // 🏆 أولوية قصوى: حالات الورشة المؤكدة بنجاح
  if (workshopCases.length > 0) {
    context += `### 🏆 سوابق وحالات مؤكدة 100% من واقع الورشة الهندسية (معتمدة بأعلى أوزان النجاح):\n`;
    workshopCases.slice(0, 3).forEach((wc, idx) => {
      context += `الحالة المؤكدة ${idx + 1} [أولوية نجاح مثبتة: ${wc.weight} صوت تأكيد]:\n`;
      context += `- الجهاز: ${wc.model} ${wc.boardCode ? `(${wc.boardCode})` : ''}\n`;
      context += `- العَرَض الدقيق: ${wc.symptom}\n`;
      if (wc.measurements?.bootCurrentmA) {
        context += `- سحب الباور سبلاي: ${wc.measurements.bootCurrentmA}\n`;
      }
      context += `- السبب الجذري المؤكد: ${wc.rootCause}\n`;
      context += `- الحل العملي الناجح: ${wc.solution}\n\n`;
    });
  }

  if (schematicContext) {
    context += `### بيانات المخطط ومصفوفة الهاردوير للجهاز (${schematicContext.deviceTitle || schematicContext.deviceModel}):\n`;
    if (schematicContext.boardCode) {
      context += `- كود المازربورد (Board Part Number): ${schematicContext.boardCode}\n`;
    }
    if (schematicContext.mainChips && Object.keys(schematicContext.mainChips).length > 0) {
      context += `- الآيسيات والرقاقات الرئيسية المسجلة:\n`;
      Object.entries(schematicContext.mainChips).forEach(([key, val]) => {
        context += `  * ${key}: ${val}\n`;
      });
    }
    if (schematicContext.relevantNets?.length) {
      context += `- مسارات التغذية الرئيسية والممانعات القياسية (Diode Mode):\n`;
      schematicContext.relevantNets.forEach(net => {
        context += `  * ${net.name} (${net.voltage}): ممانعة ${net.diodeMode} | حقن آمن: ${net.safeInjection || 'N/A'}\n`;
      });
    }
    if (schematicContext.commonFaults?.length) {
      context += `- أشهر الأعطال المسجلة هندسياً لهذا الموديل:\n`;
      schematicContext.commonFaults.forEach(f => {
        context += `  * العَرَض: ${f.symptom} -> السبب: ${f.cause} -> الحل: ${f.solution}\n`;
      });
    }
    context += '\n';
  }

  if (expertPatterns.length > 0) {
    context += `### أنماط مرجعية من قاعدة خبرات كبار المهندسين:\n`;
    expertPatterns.forEach((p, idx) => {
      context += `نمط ${idx + 1} (${p.category}):\n- العَرَض: ${p.symptom}\n- الحل الدقيق: ${p.solution}\n\n`;
    });
  }

  if (context) {
    context = `\n--- [معطيات المخططات وسجل حالات الورشة الهندسية المعتمدة] ---\n${context}القاعدة الإلزامية: إذا وُجدت "حالات مؤكدة 100% من واقع الورشة"، قدم حلها فوراً كأول توصية عملية رئيسية للفني، واستخدم المعطيات المرجعية والرموز وأسماء الآيسيات وكود المازربورد المذكور أعلاه كدليل أساسي في إجابتك وتشخيصك.\n--- [نهاية المعطيات المرجعية] ---\n\n`;
  }

  return context;
}
