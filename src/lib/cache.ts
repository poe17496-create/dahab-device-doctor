import { supabaseAdmin } from './supabase';
import crypto from 'crypto';

/**
 * Interface for cache entry
 */
export interface CacheEntry {
  id: string;
  cache_key: string;
  cache_value: any;
  expires_at: string;
  created_at: string;
  hit_count: number;
}

/**
 * Generate a consistent hash for cache key
 */
export function generateCacheKey(prompt: string, context?: any): string {
  const hashInput = JSON.stringify({ prompt, context });
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Get cached response from Supabase
 * @param cacheKey - The unique key for the cache entry
 * @returns The cached value or null if not found/expired
 */
export async function getCachedResponse(cacheKey: string): Promise<any | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('cache_entries')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      // If no rows found, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching cached response:', error);
      return null;
    }

    // Increment hit count
    await supabaseAdmin
      .from('cache_entries')
      .update({ hit_count: (data.hit_count || 0) + 1 } as any)
      .eq('id', data.id);

    return data.cache_value;
  } catch (error) {
    console.error('Error in getCachedResponse:', error);
    return null;
  }
}

/**
 * Set cached response in Supabase
 * @param cacheKey - The unique key for the cache entry
 * @param cacheValue - The value to cache
 * @param ttlHours - Time to live in hours (default: 24)
 */
export async function setCachedResponse(
  cacheKey: string,
  cacheValue: any,
  ttlHours: number = 24
): Promise<boolean> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    const { error } = await supabaseAdmin
      .from('cache_entries')
      .upsert({
        cache_key: cacheKey,
        cache_value: cacheValue,
        expires_at: expiresAt.toISOString(),
        hit_count: 0,
      } as any, {
        onConflict: 'cache_key'
      });

    if (error) {
      console.error('Error setting cached response:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in setCachedResponse:', error);
    return false;
  }
}

/**
 * Clear expired cache entries (cleanup function)
 * Can be called periodically via cron job
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('cache_entries')
      .delete()
      .lte('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      console.error('Error clearing expired cache:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in clearExpiredCache:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  totalHits: number;
  avgHitCount: number;
}> {
  try {
    const [totalResult, activeResult, expiredResult] = await Promise.all([
      supabaseAdmin.from('cache_entries').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('cache_entries').select('id', { count: 'exact', head: true }).gt('expires_at', new Date().toISOString()),
      supabaseAdmin.from('cache_entries').select('id', { count: 'exact', head: true }).lte('expires_at', new Date().toISOString()),
    ]);

    const { data: hitsData } = await supabaseAdmin
      .from('cache_entries')
      .select('hit_count');

    const totalHits = hitsData?.reduce((sum: number, entry: any) => sum + (entry.hit_count || 0), 0) || 0;
    const avgHitCount = hitsData?.length > 0 ? totalHits / hitsData.length : 0;

    return {
      totalEntries: totalResult.count || 0,
      activeEntries: activeResult.count || 0,
      expiredEntries: expiredResult.count || 0,
      totalHits,
      avgHitCount,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalEntries: 0,
      activeEntries: 0,
      expiredEntries: 0,
      totalHits: 0,
      avgHitCount: 0,
    };
  }
}
