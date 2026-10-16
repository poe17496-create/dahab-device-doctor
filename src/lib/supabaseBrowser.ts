import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * عميل Supabase موحد (Singleton) لبيئة المتصفح لمنع تحذير:
 * "Multiple GoTrueClient instances detected in the same browser context"
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
