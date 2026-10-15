import matrixData from '@/lib/hardwareSchematicsMatrix.json';

export interface BoardMatch {
  brand: string;
  model: string;
  boardCode: string;
  category: string;
  matchType?: 'model' | 'boardCode';
}

export interface PartNumberMatch {
  brand: string;
  model: string;
  boardCode: string;
  category: string;
  chipRole: string;
  partNumber: string;
}

export interface SimilarBoardMatch {
  brand: string;
  model: string;
  boardCode: string;
  category: string;
  sharedChips: string[];
  similarityScore: number;
}

export interface UniversalBoardSearchResult {
  exactMatches: BoardMatch[];
  partNumberMatches: PartNumberMatch[];
  similarBoards: SimilarBoardMatch[];
  matchedPartNumber?: string;
}

let matrixCache: any[] | null = null;

function loadMatrix(): any[] {
  if (matrixCache) return matrixCache;
  try {
    if (matrixData && Array.isArray(matrixData)) {
      matrixCache = matrixData;
      return matrixCache;
    }
  } catch (e) {
    console.error('Failed to parse hardwareSchematicsMatrix:', e);
  }
  return [];
}

/**
 * بحث موحد ذكي - يبحث بالموديل أو البارت نمبر أو كود البوردة
 * يجد كل البوردات المتشابهة التي تتشارك في نفس الآيسيهات
 * آمن تماماً للاستخدام في المتصفح والـ Client Components بدون استدعاءات سيرفر
 */
export function universalBoardSearch(query: string): UniversalBoardSearchResult {
  if (!query || query.trim().length < 2) {
    return { exactMatches: [], partNumberMatches: [], similarBoards: [] };
  }

  const q = query.trim().toLowerCase();
  const result: UniversalBoardSearchResult = {
    exactMatches: [],
    partNumberMatches: [],
    similarBoards: [],
    matchedPartNumber: undefined,
  };

  const boards = loadMatrix() || [];
  if (boards.length === 0) return result;

  // 1. بحث مباشر بالموديل أو كود البوردة
  for (const board of boards) {
    const model = (board.model || '').toLowerCase();
    const boardCode = (board.boardCode || '').toLowerCase();
    const brand = (board.brand || '').toLowerCase();

    if (model.includes(q) || boardCode.includes(q) || `${brand} ${model}`.includes(q)) {
      result.exactMatches.push({
        brand: board.brand || '',
        model: board.model || '',
        boardCode: board.boardCode || '',
        category: board.category || '',
        matchType: boardCode.includes(q) ? 'boardCode' : 'model',
      });
    }
  }

  // 2. بحث بالبارت نمبر في mainChips لكل بوردة
  const boardsWithMatchedChip: Array<{ board: any; chipRole: string; partNumber: string }> = [];

  for (const board of boards) {
    const chips = board.mainChips || {};
    for (const [role, chipPartNumber] of Object.entries(chips)) {
      const pn = String(chipPartNumber).toLowerCase();
      if (pn.includes(q) || q.includes(pn)) {
        boardsWithMatchedChip.push({ board, chipRole: role, partNumber: String(chipPartNumber) });
        if (!result.matchedPartNumber) {
          result.matchedPartNumber = String(chipPartNumber);
        }
      }
    }
  }

  for (const match of boardsWithMatchedChip) {
    result.partNumberMatches.push({
      brand: match.board.brand || '',
      model: match.board.model || '',
      boardCode: match.board.boardCode || '',
      category: match.board.category || '',
      chipRole: match.chipRole,
      partNumber: match.partNumber,
    });
  }

  // 3. البوردات المتشابهة (تتشارك في 2+ آيسي مع البوردة المطابقة)
  if (result.exactMatches.length > 0 || boardsWithMatchedChip.length > 0) {
    const matchedBoardCodes = new Set<string>();
    const referenceChips = new Map<string, string>(); // partNumber -> role

    for (const em of result.exactMatches) {
      matchedBoardCodes.add(em.boardCode.toLowerCase());
      const board = boards.find(b => (b.boardCode || '').toLowerCase() === em.boardCode.toLowerCase());
      if (board?.mainChips) {
        for (const [role, pn] of Object.entries(board.mainChips)) {
          referenceChips.set(String(pn).toLowerCase(), role);
        }
      }
    }

    for (const pm of boardsWithMatchedChip) {
      matchedBoardCodes.add((pm.board.boardCode || '').toLowerCase());
      if (pm.board.mainChips) {
        for (const [role, pn] of Object.entries(pm.board.mainChips)) {
          referenceChips.set(String(pn).toLowerCase(), role);
        }
      }
    }

    for (const board of boards) {
      const bc = (board.boardCode || '').toLowerCase();
      if (matchedBoardCodes.has(bc)) continue;

      const chips = board.mainChips || {};
      const sharedChips: string[] = [];

      for (const [, pn] of Object.entries(chips)) {
        const pnLower = String(pn).toLowerCase();
        if (referenceChips.has(pnLower)) {
          sharedChips.push(String(pn));
        }
      }

      if (sharedChips.length >= 2) {
        result.similarBoards.push({
          brand: board.brand || '',
          model: board.model || '',
          boardCode: board.boardCode || '',
          category: board.category || '',
          sharedChips,
          similarityScore: sharedChips.length,
        });
      }
    }

    result.similarBoards.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  return result;
}
