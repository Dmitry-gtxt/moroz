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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      availability_slots: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          performer_id: string
          price: number | null
          start_time: string
          status: Database["public"]["Enums"]["slot_status"]
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          performer_id: string
          price?: number | null
          start_time: string
          status?: Database["public"]["Enums"]["slot_status"]
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          performer_id?: string
          price?: number | null
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
          {
            foreignKeyName: "availability_slots_performer_id_fkey"
            columns: ["performer_id"]
            isOneToOne: false
            referencedRelation: "public_performers"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_proposals: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          proposed_date: string
          proposed_price: number | null
          proposed_time: string
          slot_id: string | null
          status: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          proposed_date: string
          proposed_price?: number | null
          proposed_time: string
          slot_id?: string | null
          status?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          proposed_date?: string
          proposed_price?: number | null
          proposed_time?: string
          slot_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_proposals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_proposals_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "secure_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_proposals_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots"
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
          payment_deadline: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          performer_id: string
          prepayment_amount: number
          price_total: number
          proposal_message: string | null
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
          payment_deadline?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          performer_id: string
          prepayment_amount: number
          price_total: number
          proposal_message?: string | null
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
          payment_deadline?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          performer_id?: string
          prepayment_amount?: number
          price_total?: number
          proposal_message?: string | null
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
            foreignKeyName: "bookings_performer_id_fkey"
            columns: ["performer_id"]
            isOneToOne: false
            referencedRelation: "public_performers"
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
          {
            foreignKeyName: "chat_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "secure_bookings"
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
      notification_queue: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          notification_type: string
          scheduled_for: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          notification_type: string
          scheduled_for: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          notification_type?: string
          scheduled_for?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_queue_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "secure_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          access_token: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          organization_type: string | null
          referral_code: string
          updated_at: string
        }
        Insert: {
          access_token?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          organization_type?: string | null
          referral_code: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          organization_type?: string | null
          referral_code?: string
          updated_at?: string
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
          program_description: string | null
          program_duration: number | null
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
          program_description?: string | null
          program_duration?: number | null
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
          program_description?: string | null
          program_duration?: number | null
          rating_average?: number | null
          rating_count?: number | null
          updated_at?: string
          user_id?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          video_greeting_url?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_bookings: {
        Row: {
          booking_amount: number
          booking_id: string
          created_at: string
          id: string
          partner_id: string
          status: string
        }
        Insert: {
          booking_amount: number
          booking_id: string
          created_at?: string
          id?: string
          partner_id: string
          status: string
        }
        Update: {
          booking_amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          partner_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "secure_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_bookings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_registrations: {
        Row: {
          id: string
          partner_id: string
          registered_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          id?: string
          partner_id: string
          registered_at?: string
          user_id: string
          user_type: string
        }
        Update: {
          id?: string
          partner_id?: string
          registered_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_registrations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_visits: {
        Row: {
          created_at: string
          id: string
          landing_page: string | null
          partner_id: string
          referrer_url: string | null
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          landing_page?: string | null
          partner_id: string
          referrer_url?: string | null
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          landing_page?: string | null
          partner_id?: string
          referrer_url?: string | null
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_visits_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "secure_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_performer_id_fkey"
            columns: ["performer_id"]
            isOneToOne: false
            referencedRelation: "performer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_performer_id_fkey"
            columns: ["performer_id"]
            isOneToOne: false
            referencedRelation: "public_performers"
            referencedColumns: ["id"]
          },
        ]
      }
      support_chats: {
        Row: {
          created_at: string
          id: string
          performer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          performer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          performer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_chats_performer_id_fkey"
            columns: ["performer_id"]
            isOneToOne: true
            referencedRelation: "performer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_chats_performer_id_fkey"
            columns: ["performer_id"]
            isOneToOne: true
            referencedRelation: "public_performers"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          sender_type: string
          text: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          sender_type: string
          text: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          sender_type?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "support_chats"
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
          {
            foreignKeyName: "verification_documents_performer_id_fkey"
            columns: ["performer_id"]
            isOneToOne: false
            referencedRelation: "public_performers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_performers: {
        Row: {
          age: number | null
          base_price: number | null
          costume_style: string | null
          created_at: string | null
          description: string | null
          display_name: string | null
          district_slugs: string[] | null
          experience_years: number | null
          formats: Database["public"]["Enums"]["event_format"][] | null
          id: string | null
          is_active: boolean | null
          performer_types:
            | Database["public"]["Enums"]["performer_type"][]
            | null
          photo_urls: string[] | null
          price_from: number | null
          price_to: number | null
          rating_average: number | null
          rating_count: number | null
          updated_at: string | null
          user_id: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          video_greeting_url: string | null
        }
        Insert: {
          age?: number | null
          base_price?: number | null
          costume_style?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          district_slugs?: string[] | null
          experience_years?: number | null
          formats?: Database["public"]["Enums"]["event_format"][] | null
          id?: string | null
          is_active?: boolean | null
          performer_types?:
            | Database["public"]["Enums"]["performer_type"][]
            | null
          photo_urls?: string[] | null
          price_from?: number | null
          price_to?: number | null
          rating_average?: number | null
          rating_count?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          video_greeting_url?: string | null
        }
        Update: {
          age?: number | null
          base_price?: number | null
          costume_style?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          district_slugs?: string[] | null
          experience_years?: number | null
          formats?: Database["public"]["Enums"]["event_format"][] | null
          id?: string | null
          is_active?: boolean | null
          performer_types?:
            | Database["public"]["Enums"]["performer_type"][]
            | null
          photo_urls?: string[] | null
          price_from?: number | null
          price_to?: number | null
          rating_average?: number | null
          rating_count?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          video_greeting_url?: string | null
        }
        Relationships: []
      }
      public_platform_settings: {
        Row: {
          key: string | null
          value: string | null
        }
        Relationships: []
      }
      public_reviews: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string | null
          performer_id: string | null
          rating: number | null
          text: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string | null
          performer_id?: string | null
          rating?: number | null
          text?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string | null
          performer_id?: string | null
          rating?: number | null
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
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "secure_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_performer_id_fkey"
            columns: ["performer_id"]
            isOneToOne: false
            referencedRelation: "performer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_performer_id_fkey"
            columns: ["performer_id"]
            isOneToOne: false
            referencedRelation: "public_performers"
            referencedColumns: ["id"]
          },
        ]
      }
      secure_bookings: {
        Row: {
          address: string | null
          booking_date: string | null
          booking_time: string | null
          cancellation_reason: string | null
          cancelled_by: string | null
          children_info: string | null
          comment: string | null
          created_at: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          district_slug: string | null
          event_type: Database["public"]["Enums"]["event_format"] | null
          id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          performer_id: string | null
          prepayment_amount: number | null
          price_total: number | null
          slot_id: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          updated_at: string | null
        }
        Insert: {
          address?: never
          booking_date?: string | null
          booking_time?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          children_info?: string | null
          comment?: string | null
          created_at?: string | null
          customer_email?: never
          customer_id?: string | null
          customer_name?: never
          customer_phone?: never
          district_slug?: string | null
          event_type?: Database["public"]["Enums"]["event_format"] | null
          id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          performer_id?: string | null
          prepayment_amount?: number | null
          price_total?: number | null
          slot_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string | null
        }
        Update: {
          address?: never
          booking_date?: string | null
          booking_time?: string | null
          cancellation_reason?: string | null
          cancelled_by?: string | null
          children_info?: string | null
          comment?: string | null
          created_at?: string | null
          customer_email?: never
          customer_id?: string | null
          customer_name?: never
          customer_phone?: never
          district_slug?: string | null
          event_type?: Database["public"]["Enums"]["event_format"] | null
          id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          performer_id?: string | null
          prepayment_amount?: number | null
          price_total?: number | null
          slot_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          updated_at?: string | null
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
            foreignKeyName: "bookings_performer_id_fkey"
            columns: ["performer_id"]
            isOneToOne: false
            referencedRelation: "public_performers"
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
    }
    Functions: {
      can_see_booking_customer_data: {
        Args: { _booking_id: string; _user_id: string }
        Returns: boolean
      }
      get_partner_by_token: {
        Args: { _token: string }
        Returns: {
          contact_email: string
          contact_phone: string
          id: string
          is_active: boolean
          name: string
          organization_type: string
          referral_code: string
        }[]
      }
      get_public_platform_settings: {
        Args: never
        Returns: {
          key: string
          value: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_booking_participant: {
        Args: { _booking_id: string; _user_id: string }
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
        | "counter_proposed"
        | "customer_accepted"
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
        "counter_proposed",
        "customer_accepted",
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
