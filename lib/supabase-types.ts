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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      project_holidays: {
        Row: {
          createdAt: string | null
          date: string
          holidayMultiplier: number | null
          id: string
          name: string
          projectId: string
          treatment: Database["public"]["Enums"]["HolidayTreatment"] | null
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          date: string
          holidayMultiplier?: number | null
          id?: string
          name: string
          projectId: string
          treatment?: Database["public"]["Enums"]["HolidayTreatment"] | null
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          date?: string
          holidayMultiplier?: number | null
          id?: string
          name?: string
          projectId?: string
          treatment?: Database["public"]["Enums"]["HolidayTreatment"] | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_holidays_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_people: {
        Row: {
          allocatedDays: number
          createdAt: string | null
          holidayMultiplier: number | null
          id: string
          level: Database["public"]["Enums"]["Level"] | null
          nonBillable: boolean | null
          notes: string | null
          personLabel: string
          pricePerDay: number
          projectId: string
          rateSource: Database["public"]["Enums"]["RateSource"] | null
          roleId: string | null
          teamMemberId: string | null
          updatedAt: string | null
          utilizationPercent: number
          weekendMultiplier: number | null
        }
        Insert: {
          allocatedDays: number
          createdAt?: string | null
          holidayMultiplier?: number | null
          id?: string
          level?: Database["public"]["Enums"]["Level"] | null
          nonBillable?: boolean | null
          notes?: string | null
          personLabel: string
          pricePerDay: number
          projectId: string
          rateSource?: Database["public"]["Enums"]["RateSource"] | null
          roleId?: string | null
          teamMemberId?: string | null
          updatedAt?: string | null
          utilizationPercent: number
          weekendMultiplier?: number | null
        }
        Update: {
          allocatedDays?: number
          createdAt?: string | null
          holidayMultiplier?: number | null
          id?: string
          level?: Database["public"]["Enums"]["Level"] | null
          nonBillable?: boolean | null
          notes?: string | null
          personLabel?: string
          pricePerDay?: number
          projectId?: string
          rateSource?: Database["public"]["Enums"]["RateSource"] | null
          roleId?: string | null
          teamMemberId?: string | null
          updatedAt?: string | null
          utilizationPercent?: number
          weekendMultiplier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_people_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_people_roleId_fkey"
            columns: ["roleId"]
            isOneToOne: false
            referencedRelation: "rate_card_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_people_teamMemberId_fkey"
            columns: ["teamMemberId"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      project_summaries: {
        Row: {
          cost: number
          createdAt: string | null
          currencyCode: string
          id: string
          marginPercent: number
          projectId: string
          proposedPrice: number
          roiPercent: number
          subtotal: number
          tax: number
          updatedAt: string | null
        }
        Insert: {
          cost: number
          createdAt?: string | null
          currencyCode: string
          id?: string
          marginPercent: number
          projectId: string
          proposedPrice: number
          roiPercent: number
          subtotal: number
          tax: number
          updatedAt?: string | null
        }
        Update: {
          cost?: number
          createdAt?: string | null
          currencyCode?: string
          id?: string
          marginPercent?: number
          projectId?: string
          proposedPrice?: number
          roiPercent?: number
          subtotal?: number
          tax?: number
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_summaries_projectId_fkey"
            columns: ["projectId"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          createdAt: string | null
          id: string
          name: string
          payload: Json
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          id?: string
          name: string
          payload: Json
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          id?: string
          name?: string
          payload?: Json
          updatedAt?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          bufferDays: number | null
          calendarMode: boolean | null
          client: string
          createdAt: string | null
          currencyCode: string | null
          currencySymbol: string | null
          endDate: string | null
          executionDays: number | null
          finalDays: number | null
          fxNote: string | null
          hoursPerDay: number | null
          id: string
          name: string
          pricingMode: Database["public"]["Enums"]["PricingMode"] | null
          proposedPrice: number | null
          startDate: string | null
          targetMarginPercent: number | null
          targetRoiPercent: number | null
          taxEnabled: boolean | null
          taxPercent: number | null
          updatedAt: string | null
          workingWeek: Database["public"]["Enums"]["WorkingWeek"] | null
        }
        Insert: {
          bufferDays?: number | null
          calendarMode?: boolean | null
          client: string
          createdAt?: string | null
          currencyCode?: string | null
          currencySymbol?: string | null
          endDate?: string | null
          executionDays?: number | null
          finalDays?: number | null
          fxNote?: string | null
          hoursPerDay?: number | null
          id?: string
          name: string
          pricingMode?: Database["public"]["Enums"]["PricingMode"] | null
          proposedPrice?: number | null
          startDate?: string | null
          targetMarginPercent?: number | null
          targetRoiPercent?: number | null
          taxEnabled?: boolean | null
          taxPercent?: number | null
          updatedAt?: string | null
          workingWeek?: Database["public"]["Enums"]["WorkingWeek"] | null
        }
        Update: {
          bufferDays?: number | null
          calendarMode?: boolean | null
          client?: string
          createdAt?: string | null
          currencyCode?: string | null
          currencySymbol?: string | null
          endDate?: string | null
          executionDays?: number | null
          finalDays?: number | null
          fxNote?: string | null
          hoursPerDay?: number | null
          id?: string
          name?: string
          pricingMode?: Database["public"]["Enums"]["PricingMode"] | null
          proposedPrice?: number | null
          startDate?: string | null
          targetMarginPercent?: number | null
          targetRoiPercent?: number | null
          taxEnabled?: boolean | null
          taxPercent?: number | null
          updatedAt?: string | null
          workingWeek?: Database["public"]["Enums"]["WorkingWeek"] | null
        }
        Relationships: []
      }
      rate_card_roles: {
        Row: {
          createdAt: string | null
          id: string
          name: string
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          id?: string
          name: string
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          id?: string
          name?: string
          updatedAt?: string | null
        }
        Relationships: []
      }
      rate_card_tiers: {
        Row: {
          active: boolean | null
          createdAt: string | null
          id: string
          level: Database["public"]["Enums"]["Level"]
          pricePerDay: number
          roleId: string
          updatedAt: string | null
        }
        Insert: {
          active?: boolean | null
          createdAt?: string | null
          id?: string
          level: Database["public"]["Enums"]["Level"]
          pricePerDay: number
          roleId: string
          updatedAt?: string | null
        }
        Update: {
          active?: boolean | null
          createdAt?: string | null
          id?: string
          level?: Database["public"]["Enums"]["Level"]
          pricePerDay?: number
          roleId?: string
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rate_card_tiers_roleId_fkey"
            columns: ["roleId"]
            isOneToOne: false
            referencedRelation: "rate_card_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          createdAt: string | null
          defaultRatePerDay: number
          id: string
          level: Database["public"]["Enums"]["Level"]
          name: string
          notes: string | null
          roleId: string | null
          roleName: string
          status: Database["public"]["Enums"]["MemberStatus"] | null
          updatedAt: string | null
        }
        Insert: {
          createdAt?: string | null
          defaultRatePerDay: number
          id?: string
          level: Database["public"]["Enums"]["Level"]
          name: string
          notes?: string | null
          roleId?: string | null
          roleName: string
          status?: Database["public"]["Enums"]["MemberStatus"] | null
          updatedAt?: string | null
        }
        Update: {
          createdAt?: string | null
          defaultRatePerDay?: number
          id?: string
          level?: Database["public"]["Enums"]["Level"]
          name?: string
          notes?: string | null
          roleId?: string | null
          roleName?: string
          status?: Database["public"]["Enums"]["MemberStatus"] | null
          updatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_roleId_fkey"
            columns: ["roleId"]
            isOneToOne: false
            referencedRelation: "rate_card_roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      HolidayTreatment: "EXCLUDE" | "BILLABLE_MULTIPLIER" | "INFO"
      Level: "TEAM_LEAD" | "SENIOR" | "JUNIOR"
      MemberStatus: "ACTIVE" | "INACTIVE"
      PricingMode: "DIRECT" | "ROI" | "MARGIN"
      RateSource: "RATE_CARD" | "CUSTOM"
      WorkingWeek: "MON_FRI" | "MON_SAT" | "SUN_THU"
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
      HolidayTreatment: ["EXCLUDE", "BILLABLE_MULTIPLIER", "INFO"],
      Level: ["TEAM_LEAD", "SENIOR", "JUNIOR"],
      MemberStatus: ["ACTIVE", "INACTIVE"],
      PricingMode: ["DIRECT", "ROI", "MARGIN"],
      RateSource: ["RATE_CARD", "CUSTOM"],
      WorkingWeek: ["MON_FRI", "MON_SAT", "SUN_THU"],
    },
  },
} as const
