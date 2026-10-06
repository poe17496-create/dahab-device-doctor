import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruxvmppycsnjhdhehtef.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eHZtcHB5Y3NuamhkaGVodGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NzA2MTgsImV4cCI6MjEwNjI0NjYxOH0.Go0B7najXxtqQAP94f5lxhWWKsg9ofouWnwsBHpDiDw'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eHZtcHB5Y3NuamhkaGVodGVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDY3MDYxOCwiZXhwIjoyMTA2MjQ2NjE4fQ.JLVCvt7Eq2g_qfrJRNYtQWv1TsdH-1Yrcq8KsRSUcHI'

// Check if Supabase is configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseServiceRoleKey
)

// Client-side Supabase client
export const supabaseClient = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!)
  : null as any

// Server-side Supabase client with service role key (for API routes and server actions)
export const supabaseAdmin = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null as any

// Server-side Supabase client with cookies (for App Router server components)
export function createSupabaseServerClient() {
  if (!isSupabaseConfigured) {
    return null
  }

  const cookieStore = cookies()

  return createServerClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
