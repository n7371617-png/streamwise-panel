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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          type: Database["public"]["Enums"]["stream_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          type?: Database["public"]["Enums"]["stream_type"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["stream_type"]
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          reseller_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          reseller_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          reseller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      iptv_users: {
        Row: {
          created_at: string
          email: string | null
          expire_at: string | null
          id: string
          is_trial: boolean
          max_connections: number
          notes: string | null
          password: string
          reseller_id: string | null
          status: Database["public"]["Enums"]["iptv_status"]
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          expire_at?: string | null
          id?: string
          is_trial?: boolean
          max_connections?: number
          notes?: string | null
          password: string
          reseller_id?: string | null
          status?: Database["public"]["Enums"]["iptv_status"]
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string | null
          expire_at?: string | null
          id?: string
          is_trial?: boolean
          max_connections?: number
          notes?: string | null
          password?: string
          reseller_id?: string | null
          status?: Database["public"]["Enums"]["iptv_status"]
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "iptv_users_reseller_id_fkey"
            columns: ["reseller_id"]
            isOneToOne: false
            referencedRelation: "resellers"
            referencedColumns: ["id"]
          },
        ]
      }
      online_sessions: {
        Row: {
          id: string
          ip: string | null
          iptv_user_id: string
          last_ping: string
          started_at: string
          stream_id: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          ip?: string | null
          iptv_user_id: string
          last_ping?: string
          started_at?: string
          stream_id?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          ip?: string | null
          iptv_user_id?: string
          last_ping?: string
          started_at?: string
          stream_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "online_sessions_iptv_user_id_fkey"
            columns: ["iptv_user_id"]
            isOneToOne: false
            referencedRelation: "iptv_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "online_sessions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      resellers: {
        Row: {
          can_create_trials: boolean
          created_at: string
          credits: number
          id: string
          notes: string | null
          total_sales: number
          updated_at: string
          user_id: string
        }
        Insert: {
          can_create_trials?: boolean
          created_at?: string
          credits?: number
          id?: string
          notes?: string | null
          total_sales?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          can_create_trials?: boolean
          created_at?: string
          credits?: number
          id?: string
          notes?: string | null
          total_sales?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      server_settings: {
        Row: {
          domain: string
          http_port: number
          https_port: number
          id: number
          rtmp_port: number
          site_name: string
          updated_at: string
        }
        Insert: {
          domain?: string
          http_port?: number
          https_port?: number
          id?: number
          rtmp_port?: number
          site_name?: string
          updated_at?: string
        }
        Update: {
          domain?: string
          http_port?: number
          https_port?: number
          id?: number
          rtmp_port?: number
          site_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      streams: {
        Row: {
          category_id: string | null
          created_at: string
          enabled: boolean
          epg_id: string | null
          id: string
          logo: string | null
          name: string
          sort_order: number
          tvg_name: string | null
          type: Database["public"]["Enums"]["stream_type"]
          url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          enabled?: boolean
          epg_id?: string | null
          id?: string
          logo?: string | null
          name: string
          sort_order?: number
          tvg_name?: string | null
          type?: Database["public"]["Enums"]["stream_type"]
          url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          enabled?: boolean
          epg_id?: string | null
          id?: string
          logo?: string | null
          name?: string
          sort_order?: number
          tvg_name?: string | null
          type?: Database["public"]["Enums"]["stream_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "streams_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip: string | null
          iptv_user_id: string | null
          metadata: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip?: string | null
          iptv_user_id?: string | null
          metadata?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip?: string | null
          iptv_user_id?: string | null
          metadata?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_logs_iptv_user_id_fkey"
            columns: ["iptv_user_id"]
            isOneToOne: false
            referencedRelation: "iptv_users"
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
          role: Database["public"]["Enums"]["app_role"]
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
      vod_episodes: {
        Row: {
          created_at: string
          duration_min: number | null
          episode: number
          id: string
          season: number
          series_id: string
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string
          duration_min?: number | null
          episode: number
          id?: string
          season?: number
          series_id: string
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string
          duration_min?: number | null
          episode?: number
          id?: string
          season?: number
          series_id?: string
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "vod_episodes_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "vod_series"
            referencedColumns: ["id"]
          },
        ]
      }
      vod_movies: {
        Row: {
          backdrop: string | null
          category_id: string | null
          created_at: string
          description: string | null
          duration_min: number | null
          genre: string | null
          id: string
          poster: string | null
          rating: number | null
          title: string
          url: string
          year: number | null
        }
        Insert: {
          backdrop?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_min?: number | null
          genre?: string | null
          id?: string
          poster?: string | null
          rating?: number | null
          title: string
          url: string
          year?: number | null
        }
        Update: {
          backdrop?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_min?: number | null
          genre?: string | null
          id?: string
          poster?: string | null
          rating?: number | null
          title?: string
          url?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vod_movies_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      vod_series: {
        Row: {
          backdrop: string | null
          category_id: string | null
          created_at: string
          description: string | null
          genre: string | null
          id: string
          poster: string | null
          rating: number | null
          title: string
          year: number | null
        }
        Insert: {
          backdrop?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          poster?: string | null
          rating?: number | null
          title: string
          year?: number | null
        }
        Update: {
          backdrop?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          poster?: string | null
          rating?: number | null
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vod_series_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
      app_role: "admin" | "reseller" | "user"
      iptv_status: "active" | "disabled" | "banned" | "expired"
      stream_type: "live" | "movie" | "series"
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
      app_role: ["admin", "reseller", "user"],
      iptv_status: ["active", "disabled", "banned", "expired"],
      stream_type: ["live", "movie", "series"],
    },
  },
} as const
