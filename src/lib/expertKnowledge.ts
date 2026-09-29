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
} from './boardviewPresets';

export interface ExpertPattern {
  symptom: string;
  solution: string;
  category: string;
}

export interface MatchedSchematicContext {
  deviceTitle?: string;
  deviceModel?: string;
  relevantNets?: { name: string; voltage: string; diodeMode: string; safeInjection?: string; description: string }[];
  relevantParts?: { name: string; role: string; commonFault: string }[];
}

export interface ComprehensiveKnowledgeResult {
  expertPatterns: ExpertPattern[];
  schematicContext?: MatchedSchematicContext;
}

let patternsCache: ExpertPattern[] | null = null;
let allBoardsCache: BoardData[] | null = null;

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

// بحث متقدم في المخططات والبورد فيو للأجهزة المطابقة
export function findRelevantSchematics(query: string, deviceModel?: string): MatchedSchematicContext | undefined {
  const boards = getAllBoardPresets();
  if (!boards.length) return undefined;

  const fullQuery = `${deviceModel || ''} ${query || ''}`.toLowerCase();
  const queryTerms = fullQuery.split(/[\s,._\-\/]+/).filter(t => t.length > 1);

  let bestBoard: BoardData | null = null;
  let bestScore = 0;

  // البحث عن البوردة الأقرب في البوردات المدمجة
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
  const relevantNets: { name: string; voltage: string; diodeMode: string; safeInjection?: string; description: string }[] = [];
  const relevantParts: { name: string; role: string; commonFault: string }[] = [];

  // استخراج المسارات الكهربائية المرتبطة بالعطل
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

  // استخراج الآيسيات والقطع المرتبطة
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

  if (schematicContext && (schematicContext.relevantNets?.length || schematicContext.relevantParts?.length)) {
    context += `\n### بيانات المخطط والبورد فيو للجهاز (${schematicContext.deviceTitle || schematicContext.deviceModel}):\n`;
    if (schematicContext.relevantNets?.length) {
      context += `- خطوط التغذية والممانعات القياسية:\n`;
      schematicContext.relevantNets.forEach(net => {
        context += `  * ${net.name} (${net.voltage}): ممانعة ${net.diodeMode} | حقن آمن: ${net.safeInjection || 'N/A'} [${net.description}]\n`;
      });
    }
    if (schematicContext.relevantParts?.length) {
      context += `- المكونات والآيسيهات ذات الصلة:\n`;
      schematicContext.relevantParts.forEach(part => {
        context += `  * ${part.name} [${part.role}]: العطل الشائع: ${part.commonFault}\n`;
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
    context = `\n--- [معطيات هندسية مرجعية مثبتة] ---\n${context}القاعدة الإلزامية: استخدم المعطيات المرجعية والرموز وأسماء الآيسيات والمسارات المذكورة أعلاه كدليل أساسي في تحليلك وتشخيصك الهندسي.\n--- [نهاية المعطيات المرجعية] ---\n\n`;
  }

  return context;
}
