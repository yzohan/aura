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
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          address: string
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          detail_laporan: string
          id: string
          ip_address: string | null
          latitude: number
          longitude: number
          photo_url: string
          reporter_id: string | null
          status_pelaporan: string
          kategori_pelaporan: string
          name: string
          email: string
          no_hp: string
          updated_at: string
        }
        Insert: {
          address: string
          category: Database["public"]["Enums"]["report_category"]
          created_at?: string
          detail_laporan: string
          id?: string
          ip_address?: string | null
          latitude: number
          longitude: number
          photo_url: string
          reporter_id?: string | null
          status_pelaporan?: string
          kategori_pelaporan?: string
          name: string
          email: string
          no_hp: string
          updated_at?: string
        }
        Update: {
          address?: string
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          detail_laporan?: string
          id?: string
          ip_address?: string | null
          latitude?: number
          longitude?: number
          photo_url?: string
          reporter_id?: string | null
          status_pelaporan?: string
          kategori_pelaporan?: string
          name?: string
          email?: string
          no_hp?: string
          updated_at?: string
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
      work_orders: {
        Row: {
          assigned_by: string
          assigned_to: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          proof_photo_url: string | null
          report_id: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          proof_photo_url?: string | null
          report_id: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          proof_photo_url?: string | null
          report_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      roads: {
        Row: {
          id: string
          name: string
          kelurahan: string | null
          kecamatan: string | null
          length_m: number | null
          condition: "baik" | "sedang" | "rusak_ringan" | "rusak_berat" | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          kelurahan?: string | null
          kecamatan?: string | null
          length_m?: number | null
          condition?: "baik" | "sedang" | "rusak_ringan" | "rusak_berat" | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          kelurahan?: string | null
          kecamatan?: string | null
          length_m?: number | null
          condition?: "baik" | "sedang" | "rusak_ringan" | "rusak_berat" | null
          created_at?: string
        }
        Relationships: []
      }
      road_facilities: {
        Row: {
          id: string
          road_id: string
          name: string
          type: string
          description: string | null
        }
        Insert: {
          id?: string
          road_id: string
          name: string
          type: string
          description?: string | null
        }
        Update: {
          id?: string
          road_id?: string
          name?: string
          type?: string
          description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "road_facilities_road_id_fkey"
            columns: ["road_id"]
            isOneToOne: false
            referencedRelation: "roads"
            referencedColumns: ["id"]
          }
        ]
      }
      laporan_jalan: {
        Row: {
          id: number
          image_file: string
          total_lubang_terdeteksi: number | null
          latitude: number
          longitude: number
          detail_lokasi: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          image_file: string
          total_lubang_terdeteksi?: number | null
          latitude: number
          longitude: number
          detail_lokasi?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          image_file?: string
          total_lubang_terdeteksi?: number | null
          latitude?: number
          longitude?: number
          detail_lokasi?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      fasilitas_radius: {
        Row: {
          id: number
          laporan_id: number
          nama_fasilitas: string
        }
        Insert: {
          id?: number
          laporan_id: number
          nama_fasilitas: string
        }
        Update: {
          id?: number
          laporan_id?: number
          nama_fasilitas?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_laporan_jalan"
            columns: ["laporan_id"]
            isOneToOne: false
            referencedRelation: "laporan_jalan"
            referencedColumns: ["id"]
          }
        ]
      }
      detail_lubang: {
        Row: {
          id: number
          laporan_id: number
          severity_visual: string
          persentase_kerusakan: number
          persentase_kedalaman: number
          kategori_pelaporan_osm: string
          nilai_score: number
          status_score: string
          petugas_penanganan: string | null
          estimasi_waktu_penanganan: string | null
        }
        Insert: {
          id?: number
          laporan_id: number
          severity_visual: string
          persentase_kerusakan: number
          persentase_kedalaman: number
          kategori_pelaporan_osm: string
          nilai_score: number
          status_score: string
          petugas_penanganan?: string | null
          estimasi_waktu_penanganan?: string | null
        }
        Update: {
          id?: number
          laporan_id?: number
          severity_visual?: string
          persentase_kerusakan?: number
          persentase_kedalaman?: number
          kategori_pelaporan_osm?: string
          nilai_score?: number
          status_score?: string
          petugas_penanganan?: string | null
          estimasi_waktu_penanganan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_laporan_jalan"
            columns: ["laporan_id"]
            isOneToOne: false
            referencedRelation: "laporan_jalan"
            referencedColumns: ["id"]
          }
        ]
      }
      metadata_ali: {
        Row: {
          id: number
          total_index_ali: number | null
          last_updated: string | null
        }
        Insert: {
          id?: number
          total_index_ali?: number | null
          last_updated?: string | null
        }
        Update: {
          id?: number
          total_index_ali?: number | null
          last_updated?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_reports_by_ip: {
        Args: { _ip: string }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "warga" | "petugas" | "admin"
      report_category: "jalan_berlubang" | "trotoar_rusak" | "pju_mati"
      report_status:
        | "pending"
        | "verified"
        | "in_progress"
        | "resolved"
        | "rejected"
      urgency_level: "low" | "medium" | "high" | "critical"
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
      app_role: ["warga", "petugas", "admin"],
      report_category: ["jalan_berlubang", "trotoar_rusak", "pju_mati"],
      report_status: [
        "pending",
        "verified",
        "in_progress",
        "resolved",
        "rejected",
      ],
      urgency_level: ["low", "medium", "high", "critical"],
    },
  },
} as const
