import { supabaseAdmin, isSupabaseConfigured } from './supabase';
import icDatabase from '../data/ic_database.json';
import { searchICDatabase as searchICDatabaseNew } from './icDatabase';

// Cache for IC database
let icCache: any[] | null = null;
let icCacheExpiry: number = 0;
const IC_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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
          partNumber: ic.part_number || '',
          category: ic.category || 'غير محدد',
          deviceFamily: ic.device_family || 'غير محدد',
          function: ic.function || 'غير محدد',
          compatibles: ic.compatibles || [],
          commonSymptoms: ic.common_symptoms || 'غير محدد',
          diodeReadings: ic.diode_readings || 'غير محدد',
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
 * Search IC database (delegates to icDatabase.ts for better functionality)
 */
export async function searchICDatabase(query: string): Promise<any[]> {
  // Use the new enhanced function from icDatabase.ts
  return await searchICDatabaseNew(query);
}

/**
 * Clear caches (for testing or manual refresh)
 */
export function clearDataCaches() {
  icCache = null;
  icCacheExpiry = 0;
  console.log('🗑️ Data caches cleared');
}
