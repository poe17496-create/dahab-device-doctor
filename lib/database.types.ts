export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          password: string
          name?: string
          created_at: string
          updated_at: string
          full_name?: string
          avatar_url?: string
          role?: 'admin' | 'user' | 'technician'
          is_active?: boolean
          device_id?: string
          expires_at?: string
          specialty?: string
          price?: number
        }
        Insert: {
          id?: string
          email: string
          username: string
          password: string
          name?: string
          created_at?: string
          updated_at?: string
          full_name?: string
          avatar_url?: string
          role?: 'admin' | 'user' | 'technician'
          is_active?: boolean
          device_id?: string
          expires_at?: string
          specialty?: string
          price?: number
        }
        Update: {
          id?: string
          email?: string
          username?: string
          password?: string
          name?: string
          created_at?: string
          updated_at?: string
          full_name?: string
          avatar_url?: string
          role?: 'admin' | 'user' | 'technician'
          is_active?: boolean
          device_id?: string
          expires_at?: string
          specialty?: string
          price?: number
        }
      }
      boardviews: {
        Row: {
          id: string
          user_id: string
          device_name: string
          model: string
          brand: string
          category: string
          created_at: string
          updated_at: string
          description?: string
          image_url?: string
          specifications?: Json
        }
        Insert: {
          id?: string
          user_id: string
          device_name: string
          model: string
          brand: string
          category: string
          created_at?: string
          updated_at?: string
          description?: string
          image_url?: string
          specifications?: Json
        }
        Update: {
          id?: string
          user_id?: string
          device_name?: string
          model?: string
          brand?: string
          category?: string
          created_at?: string
          updated_at?: string
          description?: string
          image_url?: string
          specifications?: Json
        }
      }
      verified_faults: {
        Row: {
          id: string
          boardview_id: string
          fault_code: string
          fault_description: string
          solution: string
          created_at: string
          updated_at: string
          verified_by?: string
          status?: 'pending' | 'verified' | 'rejected'
          reference_links?: string[]
        }
        Insert: {
          id?: string
          boardview_id: string
          fault_code: string
          fault_description: string
          solution: string
          created_at?: string
          updated_at?: string
          verified_by?: string
          status?: 'pending' | 'verified' | 'rejected'
          reference_links?: string[]
        }
        Update: {
          id?: string
          boardview_id?: string
          fault_code?: string
          fault_description?: string
          solution?: string
          created_at?: string
          updated_at?: string
          verified_by?: string
          status?: 'pending' | 'verified' | 'rejected'
          reference_links?: string[]
        }
      }
      ic_database: {
        Row: {
          id: string
          part_number: string
          manufacturer: string
          description: string
          package_type: string
          category: string
          datasheet_url?: string
          pinout?: Json
          specifications?: Json
          created_at: string
          updated_at: string
          alternates?: string[]
        }
        Insert: {
          id?: string
          part_number: string
          manufacturer: string
          description: string
          package_type: string
          category: string
          datasheet_url?: string
          pinout?: Json
          specifications?: Json
          created_at?: string
          updated_at?: string
          alternates?: string[]
        }
        Update: {
          id?: string
          part_number?: string
          manufacturer?: string
          description?: string
          package_type?: string
          category?: string
          datasheet_url?: string
          pinout?: Json
          specifications?: Json
          created_at?: string
          updated_at?: string
          alternates?: string[]
        }
      }
      ratings: {
        Row: {
          id: string
          user_id: string
          target_type: 'boardview' | 'ic' | 'tutorial'
          target_id: string
          rating: number
          comment?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_type: 'boardview' | 'ic' | 'tutorial'
          target_id: string
          rating: number
          comment?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_type?: 'boardview' | 'ic' | 'tutorial'
          target_id?: string
          rating?: number
          comment?: string
          created_at?: string
          updated_at?: string
        }
      }
      discussions: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          category: string
          created_at: string
          updated_at: string
          tags?: string[]
          status?: 'open' | 'closed' | 'resolved'
          view_count?: number
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          category: string
          created_at?: string
          updated_at?: string
          tags?: string[]
          status?: 'open' | 'closed' | 'resolved'
          view_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          category?: string
          created_at?: string
          updated_at?: string
          tags?: string[]
          status?: 'open' | 'closed' | 'resolved'
          view_count?: number
        }
      }
      replies: {
        Row: {
          id: string
          discussion_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
          parent_reply_id?: string
          is_solution?: boolean
        }
        Insert: {
          id?: string
          discussion_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
          parent_reply_id?: string
          is_solution?: boolean
        }
        Update: {
          id?: string
          discussion_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
          parent_reply_id?: string
          is_solution?: boolean
        }
      }
      tutorials: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          category: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          created_at: string
          updated_at: string
          image_url?: string
          tags?: string[]
          estimated_time?: number
          video_url?: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          category: string
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          created_at?: string
          updated_at?: string
          image_url?: string
          tags?: string[]
          estimated_time?: number
          video_url?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          category?: string
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          created_at?: string
          updated_at?: string
          image_url?: string
          tags?: string[]
          estimated_time?: number
          video_url?: string
        }
      }
      cache_entries: {
        Row: {
          id: string
          key: string
          value: Json
          expires_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      diagnosis_history: {
        Row: {
          id: string
          user_id: string
          device_info: Json
          symptoms: string[]
          diagnosis: string
          confidence: number
          created_at: string
          updated_at: string
          is_successful?: boolean
          notes?: string
        }
        Insert: {
          id?: string
          user_id: string
          device_info: Json
          symptoms: string[]
          diagnosis: string
          confidence: number
          created_at?: string
          updated_at?: string
          is_successful?: boolean
          notes?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_info?: Json
          symptoms?: string[]
          diagnosis?: string
          confidence?: number
          created_at?: string
          updated_at?: string
          is_successful?: boolean
          notes?: string
        }
      }
      database_backups: {
        Row: {
          id: string
          backup_data: Json
          description?: string
          tables_count?: number
          total_records?: number
          size_estimate?: string
          created_by?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          backup_data: Json
          description?: string
          tables_count?: number
          total_records?: number
          size_estimate?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          backup_data?: Json
          description?: string
          tables_count?: number
          total_records?: number
          size_estimate?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      restore_logs: {
        Row: {
          id: string
          backup_id: string
          restored_by?: string
          tables_restored?: string[]
          results: Json
          success?: boolean
          created_at: string
        }
        Insert: {
          id?: string
          backup_id: string
          restored_by?: string
          tables_restored?: string[]
          results: Json
          success?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          backup_id?: string
          restored_by?: string
          tables_restored?: string[]
          results?: Json
          success?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type helpers for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
