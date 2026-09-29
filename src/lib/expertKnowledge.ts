import fs from 'fs';
import path from 'path';
import {
  BoardData,
  buildIphone14ProMaxBoard,
  buildIphone13ProBoard,
  buildIphone12ProBoard,
  buildIphone11ProMaxBoard,
  buildSamsungS24UltraBoard,
  buildSamsungA54Board,
  buildPocoX3ProBoard,
  buildMacBookAirM2Board,
  buildMacBookIntelA1708Board,
  buildDellXpsBoard,
  buildLenovoThinkPadBoard,
  buildDellInspiron3521Board,
  buildHpProBook450Board,
  buildDesktopH81Board,
  buildRtx3060GpuBoard,
} from './boardviewPresets';

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
let allBoardsCache: BoardData[] | null = null;

// تحميل مصفوفة المخططات الضخمة من ملف hardwareSchematicsMatrix.json
function loadHardwareMatrix(): HardwareMatrixItem[] {
  if (hardwareMatrixCache) return hardwareMatrixCache;
  try {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'hardwareSchematicsMatrix.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      hardwareMatrixCache = JSON.parse(data);
      return hardwareMatrixCache || [];
    }
  } catch (error) {
    console.error('Error loading hardwareSchematicsMatrix.json:', error);
  }
  hardwareMatrixCache = [];
  return hardwareMatrixCache;
}

// تجميع البوردات المحفوظة في الذاكرة لتسريع البحث
function getAllBoardPresets(): BoardData[] {
  if (allBoardsCache) return allBoardsCache;
  try {
    allBoardsCache = [
      buildIphone14ProMaxBoard(),
      buildIphone13ProBoard(),
      buildIphone12ProBoard(),
      buildIphone11ProMaxBoard(),
      buildSamsungS24UltraBoard(),
      buildSamsungA54Board(),
      buildPocoX3ProBoard(),
      buildMacBookAirM2Board(),
      buildMacBookIntelA1708Board(),
      buildDellXpsBoard(),
      buildLenovoThinkPadBoard(),
      buildDellInspiron3521Board(),
      buildHpProBook450Board(),
      buildDesktopH81Board(),
      buildRtx3060GpuBoard(),
    ];
  } catch (err) {
    console.error('Error instantiating board presets:', err);
    allBoardsCache = [];
  }
  return allBoardsCache;
}

// تحميل أنماط الصيانة من ملف JSON مع كاش سريع في الذاكرة
function loadPatterns(): ExpertPattern[] {
  if (patternsCache) return patternsCache;
  try {
    const filePath = path.join(process.cwd(), 'expert_patterns.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      patternsCache = JSON.parse(data);
      return patternsCache || [];
    }
  } catch (error) {
    console.error('Error loading expert_patterns.json:', error);
  }
  patternsCache = [];
  return patternsCache;
}

// بحث متقدم وسريع في الأنماط المرجعية
export function findRelevantPatterns(symptom: string, category?: string): ExpertPattern[] {
  const patterns = loadPatterns();
  if (!patterns.length) return [];

  const queryTerms = symptom.toLowerCase().split(/[\s,._\-\/]+/).filter(t => t.length > 1);
  if (!queryTerms.length) return [];

  const scoredPatterns = patterns.map(pattern => {
    let score = 0;
    const patternSymptom = (pattern.symptom || '').toLowerCase();
    const patternSolution = (pattern.solution || '').toLowerCase();
    
    // مكافأة مطابقة الفئة
    if (category && pattern.category && pattern.category.toLowerCase().includes(category.toLowerCase())) {
      score += 2;
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

// بحث متقدم وشامل في مصفوفة المخططات (Hardware Schematics Matrix)
export function findRelevantSchematics(query: string, deviceModel?: string): MatchedSchematicContext | undefined {
  const matrix = loadHardwareMatrix();
  const fullQuery = `${deviceModel || ''} ${query || ''}`.toLowerCase();
  const queryTerms = fullQuery.split(/[\s,._\-\/]+/).filter(t => t.length > 1);

  if (matrix.length > 0) {
    let bestMatch: HardwareMatrixItem | null = null;
    let bestScore = 0;

    matrix.forEach(item => {
      let score = 0;
      const modelLower = item.model.toLowerCase();
      const boardLower = (item.boardCode || '').toLowerCase();
      const brandLower = item.brand.toLowerCase();

      if (deviceModel && (modelLower.includes(deviceModel.toLowerCase()) || deviceModel.toLowerCase().includes(modelLower))) {
        score += 20;
      }

      queryTerms.forEach(term => {
        if (modelLower.includes(term)) score += 5;
        if (boardLower.includes(term)) score += 6;
        if (brandLower === term) score += 3;
      });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    });

    if (bestMatch && bestScore >= 3) {
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

  // البحث في البوردات المدمجة التفاعلية كخيار تكميلي
  const boards = getAllBoardPresets();
  let bestBoard: BoardData | null = null;
  let bestScore = 0;

  boards.forEach((board) => {
    if (!board) return;
    let score = 0;
    const model = (board.deviceModel || '').toLowerCase();
    const title = (board.title || '').toLowerCase();

    if (deviceModel && (model.includes(deviceModel.toLowerCase()) || deviceModel.toLowerCase().includes(model))) {
      score += 10;
    }

    queryTerms.forEach(term => {
      if (model.includes(term)) score += 4;
      if (title.includes(term)) score += 3;
    });

    if (score > bestScore) {
      bestScore = score;
      bestBoard = board;
    }
  });

  if (!bestBoard || bestScore < 2) return undefined;

  const board: BoardData = bestBoard;
  const relevantNets: { name: string; voltage: string; diodeMode: string; safeInjection?: string; description?: string }[] = [];
  const relevantParts: { name: string; role: string; commonFault: string }[] = [];

  if (board.nets) {
    Object.values(board.nets).forEach(net => {
      if (net.isGround) return;
      const netStr = `${net.name} ${net.description}`.toLowerCase();
      const isMatch = queryTerms.some(term => netStr.includes(term)) || net.isPower;
      if (isMatch && relevantNets.length < 6) {
        relevantNets.push({
          name: net.name,
          voltage: net.voltage,
          diodeMode: net.diodeMode,
          safeInjection: net.safeInjectionVoltage,
          description: net.description,
        });
      }
    });
  }

  if (board.parts) {
    board.parts.forEach(part => {
      const partStr = `${part.name} ${part.role} ${part.commonFault}`.toLowerCase();
      const isMatch = queryTerms.some(term => partStr.includes(term));
      if ((isMatch || relevantParts.length < 3) && relevantParts.length < 5) {
        relevantParts.push({
          name: part.name,
          role: part.role,
          commonFault: part.commonFault,
        });
      }
    });
  }

  return {
    deviceTitle: board.title,
    deviceModel: board.deviceModel,
    relevantNets,
    relevantParts,
  };
}

// دمج المعرفة الفائقة في كائن واحد سريع ومضغوط
export function getCompressedExpertKnowledge(query: string, specialty?: string, deviceModel?: string): ComprehensiveKnowledgeResult {
  const expertPatterns = findRelevantPatterns(query, specialty);
  const schematicContext = findRelevantSchematics(query, deviceModel);

  return {
    expertPatterns,
    schematicContext,
  };
}

// صياغة سياق الذكاء الاصطناعي بدقة متناهية وبأقل استهلاك للتوكنز
export function buildExpertPromptContext(query: string, specialty?: string, deviceModel?: string): string {
  const { expertPatterns, schematicContext } = getCompressedExpertKnowledge(query, specialty, deviceModel);

  let context = '';

  if (schematicContext) {
    context += `\n### بيانات المخطط ومصفوفة الهاردوير للجهاز (${schematicContext.deviceTitle || schematicContext.deviceModel}):\n`;
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
    context = `\n--- [معطيات المخططات وقاعدة الخبرات الهندسية المضغوطة] ---\n${context}القاعدة الإلزامية: استخدم المعطيات المرجعية والرموز وأسماء الآيسيات وكود المازربورد المذكور أعلاه كدليل أساسي في إجابتك وتشخيصك.\n--- [نهاية المعطيات المرجعية] ---\n\n`;
  }

  return context;
}
