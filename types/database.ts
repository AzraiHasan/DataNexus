// Define database schema types for TypeScript type safety when working with Supabase

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name?: string
          company_id: string
          role?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string
          company_id: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          company_id?: string
          role?: string
          updated_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          company_id: string
          created_by: string
          report_type: string
          title: string
          description?: string
          parameters?: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string // Optional as it can be auto-generated
          company_id: string
          created_by: string
          report_type: string
          title: string
          description?: string
          parameters?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          created_by?: string
          report_type?: string
          title?: string
          description?: string | null
          parameters?: Record<string, any>
          updated_at?: string
        }
      }
      report_shares: {
        Row: {
          id: string
          report_id: string
          shared_by: string
          shared_with: string
          access_level: string
          created_at: string
          updated_at?: string
          expires_at?: string
        }
        Insert: {
          id?: string
          report_id: string
          shared_by: string
          shared_with: string
          access_level: string
          created_at?: string
          updated_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          shared_by?: string
          shared_with?: string
          access_level?: string
          updated_at?: string
          expires_at?: string | null
        }
      }
    }
    Views: {
      shared_reports_view: {
        Row: {
          id: string
          report_id: string
          access_level: string
          expires_at?: string
          created_at: string
          report_title: string
          report_type: string
          shared_by_email: string
          shared_by_name?: string
          shared_with_email: string
          shared_with_name?: string
        }
      }
    }
  }
}

// Export type helpers for making Supabase queries more type-safe
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
