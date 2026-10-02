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
      engineering_references: {
        Row: {
          id: string
          title: string
          description?: string
          reference_type: 'datasheet' | 'application_note' | 'whitepaper' | 'technical_manual' | 'standard' | 'guide'
          manufacturer?: string
          part_number?: string
          category?: string
          url?: string
          pdf_url?: string
          pages?: number
          publication_date?: string
          language?: string
          tags?: string[]
          source?: string
          reliability_score?: number
          created_at: string
          updated_at: string
          created_by?: string
          verified_by?: string
          verified_at?: string
          is_official?: boolean
          metadata?: Json
        }
        Insert: {
          id?: string
          title: string
          description?: string
          reference_type: 'datasheet' | 'application_note' | 'whitepaper' | 'technical_manual' | 'standard' | 'guide'
          manufacturer?: string
          part_number?: string
          category?: string
          url?: string
          pdf_url?: string
          pages?: number
          publication_date?: string
          language?: string
          tags?: string[]
          source?: string
          reliability_score?: number
          created_at?: string
          updated_at?: string
          created_by?: string
          verified_by?: string
          verified_at?: string
          is_official?: boolean
          metadata?: Json
        }
        Update: {
          id?: string
          title?: string
          description?: string
          reference_type?: 'datasheet' | 'application_note' | 'whitepaper' | 'technical_manual' | 'standard' | 'guide'
          manufacturer?: string
          part_number?: string
          category?: string
          url?: string
          pdf_url?: string
          pages?: number
          publication_date?: string
          language?: string
          tags?: string[]
          source?: string
          reliability_score?: number
          created_at?: string
          updated_at?: string
          created_by?: string
          verified_by?: string
          verified_at?: string
          is_official?: boolean
          metadata?: Json
        }
      }
      case_studies: {
        Row: {
          id: string
          title: string
          description?: string
          device_brand: string
          device_model: string
          device_category?: string
          fault_category: string
          fault_description: string
          symptoms: string[]
          diagnosis: string
          solution: string
          required_tools?: string[]
          required_parts?: string[]
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          estimated_time?: number
          success_rate?: number
          related_ics?: string[]
          related_faults?: string[]
          images?: string[]
          video_url?: string
          created_at: string
          updated_at: string
          created_by?: string
          verified_by?: string
          verified_at?: string
          status?: 'pending' | 'verified' | 'rejected'
          view_count?: number
          helpful_count?: number
          metadata?: Json
        }
        Insert: {
          id?: string
          title: string
          description?: string
          device_brand: string
          device_model: string
          device_category?: string
          fault_category: string
          fault_description: string
          symptoms: string[]
          diagnosis: string
          solution: string
          required_tools?: string[]
          required_parts?: string[]
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          estimated_time?: number
          success_rate?: number
          related_ics?: string[]
          related_faults?: string[]
          images?: string[]
          video_url?: string
          created_at?: string
          updated_at?: string
          created_by?: string
          verified_by?: string
          verified_at?: string
          status?: 'pending' | 'verified' | 'rejected'
          view_count?: number
          helpful_count?: number
          metadata?: Json
        }
        Update: {
          id?: string
          title?: string
          description?: string
          device_brand?: string
          device_model?: string
          device_category?: string
          fault_category?: string
          fault_description?: string
          symptoms?: string[]
          diagnosis?: string
          solution?: string
          required_tools?: string[]
          required_parts?: string[]
          difficulty_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          estimated_time?: number
          success_rate?: number
          related_ics?: string[]
          related_faults?: string[]
          images?: string[]
          video_url?: string
          created_at?: string
          updated_at?: string
          created_by?: string
          verified_by?: string
          verified_at?: string
          status?: 'pending' | 'verified' | 'rejected'
          view_count?: number
          helpful_count?: number
          metadata?: Json
        }
      }
      repair_logs: {
        Row: {
          id: string
          case_study_id?: string
          user_id: string
          device_brand: string
          device_model: string
          serial_number?: string
          symptoms: string[]
          initial_diagnosis?: string
          steps_taken: Json
          tools_used?: string[]
          parts_replaced?: string[]
          measurements?: Json
          final_diagnosis?: string
          outcome?: 'success' | 'partial_success' | 'failed' | 'in_progress'
          time_spent?: number
          cost?: number
          lessons_learned?: string
          created_at: string
          updated_at: string
          images?: string[]
          notes?: string
        }
        Insert: {
          id?: string
          case_study_id?: string
          user_id: string
          device_brand: string
          device_model: string
          serial_number?: string
          symptoms: string[]
          initial_diagnosis?: string
          steps_taken: Json
          tools_used?: string[]
          parts_replaced?: string[]
          measurements?: Json
          final_diagnosis?: string
          outcome?: 'success' | 'partial_success' | 'failed' | 'in_progress'
          time_spent?: number
          cost?: number
          lessons_learned?: string
          created_at?: string
          updated_at?: string
          images?: string[]
          notes?: string
        }
        Update: {
          id?: string
          case_study_id?: string
          user_id?: string
          device_brand?: string
          device_model?: string
          serial_number?: string
          symptoms?: string[]
          initial_diagnosis?: string
          steps_taken?: Json
          tools_used?: string[]
          parts_replaced?: string[]
          measurements?: Json
          final_diagnosis?: string
          outcome?: 'success' | 'partial_success' | 'failed' | 'in_progress'
          time_spent?: number
          cost?: number
          lessons_learned?: string
          created_at?: string
          updated_at?: string
          images?: string[]
          notes?: string
        }
      }
      component_relationships: {
        Row: {
          id: string
          source_component: string
          source_type: 'ic' | 'capacitor' | 'resistor' | 'transistor' | 'coil' | 'connector' | 'other'
          target_component: string
          target_type: 'ic' | 'capacitor' | 'resistor' | 'transistor' | 'coil' | 'connector' | 'other'
          relationship_type: 'powers' | 'controlled_by' | 'interacts_with' | 'located_near' | 'signal_path' | 'thermal_dependency' | 'voltage_reference'
          relationship_description?: string
          device_brand?: string
          device_model?: string
          confidence_score?: number
          source_reference?: string
          created_at: string
          updated_at: string
          created_by?: string
          verified?: boolean
        }
        Insert: {
          id?: string
          source_component: string
          source_type: 'ic' | 'capacitor' | 'resistor' | 'transistor' | 'coil' | 'connector' | 'other'
          target_component: string
          target_type: 'ic' | 'capacitor' | 'resistor' | 'transistor' | 'coil' | 'connector' | 'other'
          relationship_type: 'powers' | 'controlled_by' | 'interacts_with' | 'located_near' | 'signal_path' | 'thermal_dependency' | 'voltage_reference'
          relationship_description?: string
          device_brand?: string
          device_model?: string
          confidence_score?: number
          source_reference?: string
          created_at?: string
          updated_at?: string
          created_by?: string
          verified?: boolean
        }
        Update: {
          id?: string
          source_component?: string
          source_type?: 'ic' | 'capacitor' | 'resistor' | 'transistor' | 'coil' | 'connector' | 'other'
          target_component?: string
          target_type?: 'ic' | 'capacitor' | 'resistor' | 'transistor' | 'coil' | 'connector' | 'other'
          relationship_type?: 'powers' | 'controlled_by' | 'interacts_with' | 'located_near' | 'signal_path' | 'thermal_dependency' | 'voltage_reference'
          relationship_description?: string
          device_brand?: string
          device_model?: string
          confidence_score?: number
          source_reference?: string
          created_at?: string
          updated_at?: string
          created_by?: string
          verified?: boolean
        }
      }
      technical_specifications: {
        Row: {
          id: string
          component_type: string
          part_number: string
          manufacturer?: string
          category?: string
          specifications: Json
          electrical_specs?: Json
          physical_specs?: Json
          thermal_specs?: Json
          pinout?: Json
          timing_specs?: Json
          application_notes?: string
          typical_applications?: string[]
          created_at: string
          updated_at: string
          datasheet_id?: string
        }
        Insert: {
          id?: string
          component_type: string
          part_number: string
          manufacturer?: string
          category?: string
          specifications: Json
          electrical_specs?: Json
          physical_specs?: Json
          thermal_specs?: Json
          pinout?: Json
          timing_specs?: Json
          application_notes?: string
          typical_applications?: string[]
          created_at?: string
          updated_at?: string
          datasheet_id?: string
        }
        Update: {
          id?: string
          component_type?: string
          part_number?: string
          manufacturer?: string
          category?: string
          specifications?: Json
          electrical_specs?: Json
          physical_specs?: Json
          thermal_specs?: Json
          pinout?: Json
          timing_specs?: Json
          application_notes?: string
          typical_applications?: string[]
          created_at?: string
          updated_at?: string
          datasheet_id?: string
        }
      }
      knowledge_graph: {
        Row: {
          id: string
          node_type: 'component' | 'fault' | 'symptom' | 'solution' | 'device' | 'category'
          node_id: string
          node_label: string
          properties?: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          node_type: 'component' | 'fault' | 'symptom' | 'solution' | 'device' | 'category'
          node_id: string
          node_label: string
          properties?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          node_type?: 'component' | 'fault' | 'symptom' | 'solution' | 'device' | 'category'
          node_id?: string
          node_label?: string
          properties?: Json
          created_at?: string
          updated_at?: string
        }
      }
      knowledge_graph_edges: {
        Row: {
          id: string
          source_node_id: string
          target_node_id: string
          edge_type: string
          edge_weight?: number
          properties?: Json
          created_at: string
        }
        Insert: {
          id?: string
          source_node_id: string
          target_node_id: string
          edge_type: string
          edge_weight?: number
          properties?: Json
          created_at?: string
        }
        Update: {
          id?: string
          source_node_id?: string
          target_node_id?: string
          edge_type?: string
          edge_weight?: number
          properties?: Json
          created_at?: string
        }
      }
      image_gallery: {
        Row: {
          id: string
          title?: string
          description?: string
          image_url: string
          thumbnail_url?: string
          category?: string
          related_type?: 'case_study' | 'repair_log' | 'ic' | 'boardview' | 'reference'
          related_id?: string
          tags?: string[]
          created_at: string
          created_by?: string
          is_verified?: boolean
        }
        Insert: {
          id?: string
          title?: string
          description?: string
          image_url: string
          thumbnail_url?: string
          category?: string
          related_type?: 'case_study' | 'repair_log' | 'ic' | 'boardview' | 'reference'
          related_id?: string
          tags?: string[]
          created_at?: string
          created_by?: string
          is_verified?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image_url?: string
          thumbnail_url?: string
          category?: string
          related_type?: 'case_study' | 'repair_log' | 'ic' | 'boardview' | 'reference'
          related_id?: string
          tags?: string[]
          created_at?: string
          created_by?: string
          is_verified?: boolean
        }
      }
      diagnostic_rules: {
        Row: {
          id: string
          rule_name: string
          rule_description?: string
          condition: Json
          action: Json
          confidence_score?: number
          priority?: number
          device_brand?: string
          device_model?: string
          fault_category?: string
          is_active?: boolean
          created_at: string
          updated_at: string
          created_by?: string
          usage_count?: number
          success_count?: number
        }
        Insert: {
          id?: string
          rule_name: string
          rule_description?: string
          condition: Json
          action: Json
          confidence_score?: number
          priority?: number
          device_brand?: string
          device_model?: string
          fault_category?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
          usage_count?: number
          success_count?: number
        }
        Update: {
          id?: string
          rule_name?: string
          rule_description?: string
          condition?: Json
          action?: Json
          confidence_score?: number
          priority?: number
          device_brand?: string
          device_model?: string
          fault_category?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
          usage_count?: number
          success_count?: number
        }
      }
      quick_reference_guides: {
        Row: {
          id: string
          title: string
          description?: string
          category: string
          content: Json
          device_brand?: string
          device_model?: string
          language?: string
          order_index?: number
          is_featured?: boolean
          created_at: string
          updated_at: string
          created_by?: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          category: string
          content: Json
          device_brand?: string
          device_model?: string
          language?: string
          order_index?: number
          is_featured?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          content?: Json
          device_brand?: string
          device_model?: string
          language?: string
          order_index?: number
          is_featured?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      cache_entries: {
        Row: {
          id: string
          cache_key: string
          cache_value: Json
          expires_at: string
          created_at: string
          hit_count: number
          metadata?: Json
        }
        Insert: {
          id?: string
          cache_key: string
          cache_value: Json
          expires_at: string
          created_at?: string
          hit_count?: number
          metadata?: Json
        }
        Update: {
          id?: string
          cache_key?: string
          cache_value?: Json
          expires_at?: string
          created_at?: string
          hit_count?: number
          metadata?: Json
        }
      }
      ic_database: {
        Row: {
          id: string
          part_number: string
          category: string
          device_family: string
          function: string
          compatibles: string[]
          common_symptoms?: string
          diode_readings?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          part_number: string
          category: string
          device_family: string
          function: string
          compatibles?: string[]
          common_symptoms?: string
          diode_readings?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          part_number?: string
          category?: string
          device_family?: string
          function?: string
          compatibles?: string[]
          common_symptoms?: string
          diode_readings?: string
          created_at?: string
          updated_at?: string
        }
      }
      hardware_schematics_matrix: {
        Row: {
          id: string
          brand: string
          model: string
          board_code: string
          category: string
          year?: number
          main_chips: Json
          power_rails: Json
          key_components: Json
          cpu?: string
          gpu?: string
          pmic?: string
          audio_codec?: string
          wifi_module?: string
          bluetooth_module?: string
          display_driver?: string
          touch_controller?: string
          storage_controller?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand: string
          model: string
          board_code: string
          category: string
          year?: number
          main_chips?: Json
          power_rails?: Json
          key_components?: Json
          cpu?: string
          gpu?: string
          pmic?: string
          audio_codec?: string
          wifi_module?: string
          bluetooth_module?: string
          display_driver?: string
          touch_controller?: string
          storage_controller?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand?: string
          model?: string
          board_code?: string
          category?: string
          year?: number
          main_chips?: Json
          power_rails?: Json
          key_components?: Json
          cpu?: string
          gpu?: string
          pmic?: string
          audio_codec?: string
          wifi_module?: string
          bluetooth_module?: string
          display_driver?: string
          touch_controller?: string
          storage_controller?: string
          created_at?: string
          updated_at?: string
        }
      }
      donor_boards: {
        Row: {
          id: string
          board_id: string
          brand: string
          model: string
          board_code: string
          category: string
          role_on_board: string
          chip_name: string
          created_at: string
        }
        Insert: {
          id?: string
          board_id: string
          brand: string
          model: string
          board_code: string
          category: string
          role_on_board: string
          chip_name: string
          created_at?: string
        }
        Update: {
          id?: string
          board_id?: string
          brand?: string
          model?: string
          board_code?: string
          category?: string
          role_on_board?: string
          chip_name?: string
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
