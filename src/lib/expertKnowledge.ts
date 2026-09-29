import fs from 'fs';
import path from 'path';

export interface ExpertPattern {
  symptom: string;
  solution: string;
  category: string;
}

let patternsCache: ExpertPattern[] | null = null;

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

export function findRelevantPatterns(symptom: string, category?: string): ExpertPattern[] {
  const patterns = loadPatterns();
  if (!patterns.length) return [];

  const queryTerms = symptom.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  const scoredPatterns = patterns.map(pattern => {
    let score = 0;
    const patternSymptom = (pattern.symptom || '').toLowerCase();
    const patternSolution = (pattern.solution || '').toLowerCase();
    
    // Category match bonus
    if (category && pattern.category && pattern.category.toLowerCase() === category.toLowerCase()) {
      score += 2;
    }

    queryTerms.forEach(term => {
      if (patternSymptom.includes(term)) score += 3;
      if (patternSolution.includes(term)) score += 1;
    });

    return { pattern, score };
  });

  return scoredPatterns
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(p => p.pattern);
}
