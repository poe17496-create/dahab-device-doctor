import { supabaseAdmin, isSupabaseConfigured } from './supabase';
import icDatabase from '../data/ic_database.json';
import {
  buildIphone15ProMaxBoard,
  buildIphone14ProMaxBoard,
  buildIphone15ProBoard,
  buildIphone13ProBoard,
  buildIphone12ProBoard,
  buildIphone11ProMaxBoard,
} from './boardviewPresets';

// Cache for IC database
let icCache: any[] | null = null;
let icCacheExpiry: number = 0;
const IC_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Cache for boardviews
let boardviewCache: any[] | null = null;
let boardviewCacheExpiry: number = 0;
const BOARDVIEW_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Get all IC entries from Supabase or fallback to local JSON
 */
export async function getAllICDatabase(): Promise<any[]> {
  // Try Supabase first
  if (isSupabaseConfigured && supabaseAdmin) {
    const now = Date.now();
    if (icCache && now < icCacheExpiry) {
      return icCache;
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('ic_database')
        .select('*');

      if (!error && data && data.length > 0) {
        // Transform Supabase data to match local format
        const transformed = data.map((ic: any) => ({
          partNumber: ic.part_number,
          category: ic.category,
          deviceFamily: ic.specifications?.deviceFamily || 'غير محدد',
          function: ic.description,
          compatibles: ic.alternates || [],
          commonSymptoms: ic.pinout?.commonSymptoms || 'غير محدد',
          diodeReadings: ic.pinout?.diodeReadings || 'غير محدد',
        }));

        icCache = transformed;
        icCacheExpiry = now + IC_CACHE_TTL;
        console.log(`✅ Loaded ${transformed.length} IC entries from Supabase`);
        return transformed;
      }
    } catch (err) {
      console.warn('Failed to fetch IC database from Supabase, using local fallback:', err);
    }
  }

  // Fallback to local JSON
  console.log('⚠️ Using local IC database JSON');
  return icDatabase;
}

/**
 * Get all boardviews from Supabase or fallback to local presets
 */
export async function getAllBoardviews(): Promise<any[]> {
  // Try Supabase first
  if (isSupabaseConfigured && supabaseAdmin) {
    const now = Date.now();
    if (boardviewCache && now < boardviewCacheExpiry) {
      return boardviewCache;
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('boardviews')
        .select('*');

      if (!error && data && data.length > 0) {
        // Transform Supabase data to match local format
        const transformed = data.map((bv: any) => ({
          id: bv.id,
          title: bv.device_name,
          deviceModel: bv.model,
          width: bv.specifications?.width || 180,
          height: bv.specifications?.height || 200,
          layersCount: bv.specifications?.layersCount || 10,
          nets: bv.specifications?.nets || {},
          parts: bv.specifications?.parts || [],
          outlinePoints: bv.specifications?.outlinePoints,
        }));

        boardviewCache = transformed;
        boardviewCacheExpiry = now + BOARDVIEW_CACHE_TTL;
        console.log(`✅ Loaded ${transformed.length} boardviews from Supabase`);
        return transformed;
      }
    } catch (err) {
      console.warn('Failed to fetch boardviews from Supabase, using local fallback:', err);
    }
  }

  // Fallback to local presets
  console.log('⚠️ Using local boardview presets');
  return [
    buildIphone15ProMaxBoard(),
    buildIphone14ProMaxBoard(),
    buildIphone15ProBoard(),
    buildIphone13ProBoard(),
    buildIphone12ProBoard(),
    buildIphone11ProMaxBoard(),
  ];
}

/**
 * Search IC database
 */
export async function searchICDatabase(query: string): Promise<any[]> {
  const allIC = await getAllICDatabase();
  const lowerQuery = query.toLowerCase();

  return allIC.filter((ic) =>
    ic.partNumber.toLowerCase().includes(lowerQuery) ||
    ic.category.toLowerCase().includes(lowerQuery) ||
    ic.deviceFamily.toLowerCase().includes(lowerQuery) ||
    ic.function.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get boardview by ID
 */
export async function getBoardviewById(id: string): Promise<any | null> {
  const allBoardviews = await getAllBoardviews();
  return allBoardviews.find((bv) => bv.id === id) || null;
}

/**
 * Clear caches (for testing or manual refresh)
 */
export function clearDataCaches() {
  icCache = null;
  icCacheExpiry = 0;
  boardviewCache = null;
  boardviewCacheExpiry = 0;
  console.log('🗑️ Data caches cleared');
}
