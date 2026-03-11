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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          record_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      batches: {
        Row: {
          batch_name: string
          cost_per_chick: number | null
          created_at: string
          created_by: string | null
          current_quantity: number
          date_introduced: string
          fowl_run_id: string | null
          id: string
          notes: string | null
          owner: Database["public"]["Enums"]["owner_type"]
          starting_quantity: number
          status: Database["public"]["Enums"]["batch_status"] | null
          updated_at: string
        }
        Insert: {
          batch_name: string
          cost_per_chick?: number | null
          created_at?: string
          created_by?: string | null
          current_quantity: number
          date_introduced?: string
          fowl_run_id?: string | null
          id?: string
          notes?: string | null
          owner: Database["public"]["Enums"]["owner_type"]
          starting_quantity: number
          status?: Database["public"]["Enums"]["batch_status"] | null
          updated_at?: string
        }
        Update: {
          batch_name?: string
          cost_per_chick?: number | null
          created_at?: string
          created_by?: string | null
          current_quantity?: number
          date_introduced?: string
          fowl_run_id?: string | null
          id?: string
          notes?: string | null
          owner?: Database["public"]["Enums"]["owner_type"]
          starting_quantity?: number
          status?: Database["public"]["Enums"]["batch_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_fowl_run_id_fkey"
            columns: ["fowl_run_id"]
            isOneToOne: false
            referencedRelation: "fowl_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_records: {
        Row: {
          amount: number
          description: string | null
          id: string
          owner: Database["public"]["Enums"]["owner_type"]
          recorded_at: string
          recorded_by: string
          reference_id: string | null
          running_balance: number
          transaction_type: string
        }
        Insert: {
          amount: number
          description?: string | null
          id?: string
          owner: Database["public"]["Enums"]["owner_type"]
          recorded_at?: string
          recorded_by: string
          reference_id?: string | null
          running_balance: number
          transaction_type: string
        }
        Update: {
          amount?: number
          description?: string | null
          id?: string
          owner?: Database["public"]["Enums"]["owner_type"]
          recorded_at?: string
          recorded_by?: string
          reference_id?: string | null
          running_balance?: number
          transaction_type?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          owner: Database["public"]["Enums"]["owner_type"]
          recorded_by: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          owner: Database["public"]["Enums"]["owner_type"]
          recorded_by: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          owner?: Database["public"]["Enums"]["owner_type"]
          recorded_by?: string
        }
        Relationships: []
      }
      feed_purchases: {
        Row: {
          bags: number
          cost_per_bag: number
          feed_type: string
          id: string
          owner: Database["public"]["Enums"]["owner_type"]
          purchased_at: string
          recorded_by: string
          supplier: string | null
          total_cost: number
        }
        Insert: {
          bags: number
          cost_per_bag: number
          feed_type: string
          id?: string
          owner: Database["public"]["Enums"]["owner_type"]
          purchased_at?: string
          recorded_by: string
          supplier?: string | null
          total_cost: number
        }
        Update: {
          bags?: number
          cost_per_bag?: number
          feed_type?: string
          id?: string
          owner?: Database["public"]["Enums"]["owner_type"]
          purchased_at?: string
          recorded_by?: string
          supplier?: string | null
          total_cost?: number
        }
        Relationships: []
      }
      fowl_runs: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          owner: Database["public"]["Enums"]["owner_type"]
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          owner: Database["public"]["Enums"]["owner_type"]
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          owner?: Database["public"]["Enums"]["owner_type"]
          updated_at?: string
        }
        Relationships: []
      }
      fridge_stock: {
        Row: {
          batch_id: string | null
          fridge_id: string
          id: string
          owner: Database["public"]["Enums"]["owner_type"]
          quantity: number
          slaughtered_at: string
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          fridge_id: string
          id?: string
          owner: Database["public"]["Enums"]["owner_type"]
          quantity?: number
          slaughtered_at?: string
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          fridge_id?: string
          id?: string
          owner?: Database["public"]["Enums"]["owner_type"]
          quantity?: number
          slaughtered_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fridge_stock_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fridge_stock_fridge_id_fkey"
            columns: ["fridge_id"]
            isOneToOne: false
            referencedRelation: "fridges"
            referencedColumns: ["id"]
          },
        ]
      }
      fridges: {
        Row: {
          capacity: number | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          owner: Database["public"]["Enums"]["owner_type"]
          temperature: number | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          owner: Database["public"]["Enums"]["owner_type"]
          temperature?: number | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          owner?: Database["public"]["Enums"]["owner_type"]
          temperature?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      natural_deaths: {
        Row: {
          batch_id: string
          fowl_run_id: string | null
          id: string
          owner: Database["public"]["Enums"]["owner_type"]
          quantity: number
          reason: string | null
          recorded_at: string
          recorded_by: string
        }
        Insert: {
          batch_id: string
          fowl_run_id?: string | null
          id?: string
          owner: Database["public"]["Enums"]["owner_type"]
          quantity: number
          reason?: string | null
          recorded_at?: string
          recorded_by: string
        }
        Update: {
          batch_id?: string
          fowl_run_id?: string | null
          id?: string
          owner?: Database["public"]["Enums"]["owner_type"]
          quantity?: number
          reason?: string | null
          recorded_at?: string
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "natural_deaths_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "natural_deaths_fowl_run_id_fkey"
            columns: ["fowl_run_id"]
            isOneToOne: false
            referencedRelation: "fowl_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          batch_id: string | null
          customer_name: string | null
          customer_phone: string | null
          ecocash_owner: Database["public"]["Enums"]["owner_type"] | null
          fridge_stock_id: string | null
          id: string
          owner: Database["public"]["Enums"]["owner_type"]
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          quantity: number
          recorded_by: string
          sold_at: string
          source: Database["public"]["Enums"]["chicken_source"]
          total_amount: number
          unit_price: number
        }
        Insert: {
          batch_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          ecocash_owner?: Database["public"]["Enums"]["owner_type"] | null
          fridge_stock_id?: string | null
          id?: string
          owner: Database["public"]["Enums"]["owner_type"]
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          quantity: number
          recorded_by: string
          sold_at?: string
          source: Database["public"]["Enums"]["chicken_source"]
          total_amount: number
          unit_price: number
        }
        Update: {
          batch_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          ecocash_owner?: Database["public"]["Enums"]["owner_type"] | null
          fridge_stock_id?: string | null
          id?: string
          owner?: Database["public"]["Enums"]["owner_type"]
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          quantity?: number
          recorded_by?: string
          sold_at?: string
          source?: Database["public"]["Enums"]["chicken_source"]
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_fridge_stock_id_fkey"
            columns: ["fridge_stock_id"]
            isOneToOne: false
            referencedRelation: "fridge_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      slaughter_records: {
        Row: {
          batch_id: string
          fowl_run_id: string | null
          fridge_id: string
          id: string
          owner: Database["public"]["Enums"]["owner_type"]
          quantity: number
          recorded_by: string
          slaughtered_at: string
        }
        Insert: {
          batch_id: string
          fowl_run_id?: string | null
          fridge_id: string
          id?: string
          owner: Database["public"]["Enums"]["owner_type"]
          quantity: number
          recorded_by: string
          slaughtered_at?: string
        }
        Update: {
          batch_id?: string
          fowl_run_id?: string | null
          fridge_id?: string
          id?: string
          owner?: Database["public"]["Enums"]["owner_type"]
          quantity?: number
          recorded_by?: string
          slaughtered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slaughter_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slaughter_records_fowl_run_id_fkey"
            columns: ["fowl_run_id"]
            isOneToOne: false
            referencedRelation: "fowl_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slaughter_records_fridge_id_fkey"
            columns: ["fridge_id"]
            isOneToOne: false
            referencedRelation: "fridges"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_adjustments: {
        Row: {
          actual_quantity: number
          adjustment_type: string
          difference: number
          id: string
          owner: string
          previous_quantity: number
          reason: string | null
          recorded_at: string
          recorded_by: string
          reference_id: string
        }
        Insert: {
          actual_quantity: number
          adjustment_type: string
          difference: number
          id?: string
          owner: string
          previous_quantity: number
          reason?: string | null
          recorded_at?: string
          recorded_by: string
          reference_id: string
        }
        Update: {
          actual_quantity?: number
          adjustment_type?: string
          difference?: number
          id?: string
          owner?: string
          previous_quantity?: number
          reason?: string | null
          recorded_at?: string
          recorded_by?: string
          reference_id?: string
        }
        Relationships: []
      }
      system_config: {
        Row: {
          config_type: string
          config_value: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          config_type: string
          config_value: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          config_type?: string
          config_value?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_owner: Database["public"]["Enums"]["owner_type"] | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_owner?: Database["public"]["Enums"]["owner_type"] | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_owner?: Database["public"]["Enums"]["owner_type"] | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_batch_weeks: { Args: { batch_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      batch_status: "active" | "sold_out" | "closed"
      chicken_source: "fowl_run" | "fridge"
      owner_type: "miss_munyanyi" | "mai_zindove"
      payment_method: "cash" | "bank" | "mobile_money" | "credit"
      user_role: "admin" | "seller"
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
      batch_status: ["active", "sold_out", "closed"],
      chicken_source: ["fowl_run", "fridge"],
      owner_type: ["miss_munyanyi", "mai_zindove"],
      payment_method: ["cash", "bank", "mobile_money", "credit"],
      user_role: ["admin", "seller"],
    },
  },
} as const
