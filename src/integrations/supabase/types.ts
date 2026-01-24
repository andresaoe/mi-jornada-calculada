export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_email: string | null
          user_name: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_email?: string | null
          user_name?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_email?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      payroll_calculations: {
        Row: {
          base_salary: number
          cesantias_interest: number
          cesantias_provision: number
          created_at: string
          health_deduction: number
          id: string
          month_year: string
          net_pay: number
          pension_deduction: number
          prima_provision: number
          regular_pay: number
          surcharges: number
          total_deductions: number
          total_earnings: number
          transport_allowance: number
          updated_at: string
          user_id: string
          withholding_tax: number
        }
        Insert: {
          base_salary: number
          cesantias_interest?: number
          cesantias_provision?: number
          created_at?: string
          health_deduction?: number
          id?: string
          month_year: string
          net_pay?: number
          pension_deduction?: number
          prima_provision?: number
          regular_pay?: number
          surcharges?: number
          total_deductions?: number
          total_earnings?: number
          transport_allowance?: number
          updated_at?: string
          user_id: string
          withholding_tax?: number
        }
        Update: {
          base_salary?: number
          cesantias_interest?: number
          cesantias_provision?: number
          created_at?: string
          health_deduction?: number
          id?: string
          month_year?: string
          net_pay?: number
          pension_deduction?: number
          prima_provision?: number
          regular_pay?: number
          surcharges?: number
          total_deductions?: number
          total_earnings?: number
          transport_allowance?: number
          updated_at?: string
          user_id?: string
          withholding_tax?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          approved: boolean
          avatar_url: string | null
          base_salary: number
          created_at: string
          email: string | null
          full_name: string | null
          google_drive_folder_id: string | null
          id: string
          transport_allowance_enabled: boolean
          transport_allowance_value: number
          updated_at: string
          uvt_value: number
        }
        Insert: {
          active?: boolean
          approved?: boolean
          avatar_url?: string | null
          base_salary?: number
          created_at?: string
          email?: string | null
          full_name?: string | null
          google_drive_folder_id?: string | null
          id: string
          transport_allowance_enabled?: boolean
          transport_allowance_value?: number
          updated_at?: string
          uvt_value?: number
        }
        Update: {
          active?: boolean
          approved?: boolean
          avatar_url?: string | null
          base_salary?: number
          created_at?: string
          email?: string | null
          full_name?: string | null
          google_drive_folder_id?: string | null
          id?: string
          transport_allowance_enabled?: boolean
          transport_allowance_value?: number
          updated_at?: string
          uvt_value?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_days: {
        Row: {
          created_at: string
          date: string
          extra_hours: number
          id: string
          is_holiday: boolean
          notes: string | null
          regular_hours: number
          shift_type: string
          synced_to_drive: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          extra_hours?: number
          id?: string
          is_holiday?: boolean
          notes?: string | null
          regular_hours?: number
          shift_type: string
          synced_to_drive?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          extra_hours?: number
          id?: string
          is_holiday?: boolean
          notes?: string | null
          regular_hours?: number
          shift_type?: string
          synced_to_drive?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_active: { Args: { _user_id: string }; Returns: boolean }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
