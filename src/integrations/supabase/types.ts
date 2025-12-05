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
      availability_slots: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          performer_id: string
          start_time: string
          status: Database["public"]["Enums"]["slot_status"]
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          performer_id: string
          start_time: string
          status?: Database["public"]["Enums"]["slot_status"]
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          performer_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["slot_status"]
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_performer_id_fkey"
            columns: ["performer_id"]
            isOneToOne: false
            referencedRelation: "performer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string
          booking_date: string
          booking_time: string
          cancellation_reason: string | null
          cancelled_by: string | null
          children_info: string | null
          comment: string | null
          created_at: string
          customer_email: string | null
          customer_id: string
          customer_name: string
          customer_phone: string
          district_slug: string
          event_type: Database["public"]["Enums"]["event_format"]
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          performer_id: string
          prepayment_amount: number
          price_total: number
          slot_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          address: string
          booking_date: string
          booking_time: string
          cancellation_reason?: string | null
          cancelled_by?: string | null
          children_info?: string | null
          comment?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id: string
          customer_name: string
          customer_phone: string
          district_slug: string
          event_type?: Database["public"]["Enums"]["event_format"]
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          performer_id: string
          prepayment_amount: number
          price_total: number
          slot_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          booking_date?: string
          booking_time?: string
          cancellation_reason?: string | null
          cancelled_by?: string | null
          children_info?: string | null
          comment?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          district_slug?: string
          event_type?: Database["public"]["Enums"]["event_format"]
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          performer_id?: string
          prepayment_amount?: number
          price_total?: number
          slot_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_performer_id_fkey"
            columns: ["performer_id"]
            isOneToOne: false
            referencedRelation: "performer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: string[] | null
          booking_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          text: string
        }
        Insert: {
          attachments?: string[] | null
          booking_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          text: string
        }
        Update: {
          attachments?: string[] | null
          booking_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      performer_profiles: {
        Row: {
          age: number | null
          base_price: number
          commission_rate: number | null
          costume_style: string | null
          created_at: string
          description: string | null
          display_name: string
          district_slugs: string[]
          experience_years: number | null
          formats: Database["public"]["Enums"]["event_format"][]
          id: string
          is_active: boolean
          performer_types: Database["public"]["Enums"]["performer_type"][]
          photo_urls: string[]
          price_from: number | null
          price_to: number | null
          rating_average: number | null
          rating_count: number | null
          updated_at: string
          user_id: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          video_greeting_url: string | null
        }
        Insert: {
          age?: number | null
          base_price?: number
          commission_rate?: number | null
          costume_style?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          district_slugs?: string[]
          experience_years?: number | null
          formats?: Database["public"]["Enums"]["event_format"][]
          id?: string
          is_active?: boolean
          performer_types?: Database["public"]["Enums"]["performer_type"][]
          photo_urls?: string[]
          price_from?: number | null
          price_to?: number | null
          rating_average?: number | null
          rating_count?: number | null
          updated_at?: string
          user_id?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          video_greeting_url?: string | null
        }
        Update: {
          age?: number | null
          base_price?: number
          commission_rate?: number | null
          costume_style?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          district_slugs?: string[]
          experience_years?: number | null
          formats?: Database["public"]["Enums"]["event_format"][]
          id?: string
          is_active?: boolean
          performer_types?: Database["public"]["Enums"]["performer_type"][]
          photo_urls?: string[]
          price_from?: number | null
          price_to?: number | null
          rating_average?: number | null
          rating_count?: number | null
          updated_at?: string
          user_id?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          video_greeting_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          created_at: string
          customer_id: string
          id: string
          is_visible: boolean
          performer_id: string
          rating: number
          text: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          customer_id: string
          id?: string
          is_visible?: boolean
          performer_id: string
          rating: number
          text?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_visible?: boolean
          performer_id?: string
          rating?: number
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_performer_id_fkey"
            columns: ["performer_id"]
            isOneToOne: false
            referencedRelation: "performer_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      verification_documents: {
        Row: {
          admin_comment: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          document_url: string
          id: string
          performer_id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["document_status"]
          uploaded_at: string
        }
        Insert: {
          admin_comment?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          document_url: string
          id?: string
          performer_id: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          uploaded_at?: string
        }
        Update: {
          admin_comment?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          document_url?: string
          id?: string
          performer_id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_performer_id_fkey"
            columns: ["performer_id"]
            isOneToOne: false
            referencedRelation: "performer_profiles"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "customer" | "performer" | "admin"
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
      document_status: "pending" | "approved" | "rejected"
      document_type: "passport" | "id_card" | "other"
      event_format:
        | "home"
        | "kindergarten"
        | "school"
        | "office"
        | "corporate"
        | "outdoor"
      payment_status: "not_paid" | "prepayment_paid" | "fully_paid" | "refunded"
      performer_type: "ded_moroz" | "snegurochka" | "santa" | "duo"
      slot_status: "free" | "booked" | "blocked"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
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
      app_role: ["customer", "performer", "admin"],
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ],
      document_status: ["pending", "approved", "rejected"],
      document_type: ["passport", "id_card", "other"],
      event_format: [
        "home",
        "kindergarten",
        "school",
        "office",
        "corporate",
        "outdoor",
      ],
      payment_status: ["not_paid", "prepayment_paid", "fully_paid", "refunded"],
      performer_type: ["ded_moroz", "snegurochka", "santa", "duo"],
      slot_status: ["free", "booked", "blocked"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
