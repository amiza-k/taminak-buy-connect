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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          quantity: number
          supplier_product_id: string
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          quantity: number
          supplier_product_id: string
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          quantity?: number
          supplier_product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          created_by: string
          id: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          subtotal: number
          supplier_product_id: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          subtotal: number
          supplier_product_id?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          subtotal?: number
          supplier_product_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_organization_id: string
          contact_phone: string | null
          created_at: string
          created_by: string
          delivery_address: string | null
          id: string
          note: string | null
          status: string
          subtotal: number
          supplier_organization_id: string
          total: number
          updated_at: string
        }
        Insert: {
          buyer_organization_id: string
          contact_phone?: string | null
          created_at?: string
          created_by: string
          delivery_address?: string | null
          id?: string
          note?: string | null
          status?: string
          subtotal?: number
          supplier_organization_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          buyer_organization_id?: string
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          delivery_address?: string | null
          id?: string
          note?: string | null
          status?: string
          subtotal?: number
          supplier_organization_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_organization_id_fkey"
            columns: ["buyer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_organization_id_fkey"
            columns: ["supplier_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          province: string | null
          supplier_status: string | null
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          province?: string | null
          supplier_status?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          province?: string | null
          supplier_status?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_submissions: {
        Row: {
          approved_product_id: string | null
          approved_supplier_product_id: string | null
          created_at: string
          id: string
          proposed_brand: string | null
          proposed_category: string | null
          proposed_category_id: string | null
          proposed_description: string | null
          proposed_image_url: string | null
          proposed_name: string
          proposed_price: number | null
          proposed_sku: string | null
          proposed_unit: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          supplier_organization_id: string
          updated_at: string
        }
        Insert: {
          approved_product_id?: string | null
          approved_supplier_product_id?: string | null
          created_at?: string
          id?: string
          proposed_brand?: string | null
          proposed_category?: string | null
          proposed_category_id?: string | null
          proposed_description?: string | null
          proposed_image_url?: string | null
          proposed_name: string
          proposed_price?: number | null
          proposed_sku?: string | null
          proposed_unit?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          supplier_organization_id: string
          updated_at?: string
        }
        Update: {
          approved_product_id?: string | null
          approved_supplier_product_id?: string | null
          created_at?: string
          id?: string
          proposed_brand?: string | null
          proposed_category?: string | null
          proposed_category_id?: string | null
          proposed_description?: string | null
          proposed_image_url?: string | null
          proposed_name?: string
          proposed_price?: number | null
          proposed_sku?: string | null
          proposed_unit?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          supplier_organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_submissions_approved_product_id_fkey"
            columns: ["approved_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_submissions_approved_supplier_product_id_fkey"
            columns: ["approved_supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_submissions_proposed_category_id_fkey"
            columns: ["proposed_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_submissions_supplier_organization_id_fkey"
            columns: ["supplier_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          buyer_organization_id: string
          comment: string | null
          created_at: string
          id: string
          order_id: string
          rating: number
          reviewer_user_id: string
          supplier_organization_id: string
          updated_at: string
        }
        Insert: {
          buyer_organization_id: string
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          rating: number
          reviewer_user_id: string
          supplier_organization_id: string
          updated_at?: string
        }
        Update: {
          buyer_organization_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          rating?: number
          reviewer_user_id?: string
          supplier_organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_buyer_organization_id_fkey"
            columns: ["buyer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_supplier_organization_id_fkey"
            columns: ["supplier_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_applications: {
        Row: {
          address: string | null
          applicant_user_id: string
          business_name: string
          city: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          owner_name: string | null
          phone: string | null
          province: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          applicant_user_id: string
          business_name: string
          city: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          owner_name?: string | null
          phone?: string | null
          province: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          applicant_user_id?: string
          business_name?: string
          city?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          owner_name?: string | null
          phone?: string | null
          province?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_offer_media: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          media_type: string
          sort_order: number
          storage_path: string
          supplier_product_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          media_type: string
          sort_order?: number
          storage_path: string
          supplier_product_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          media_type?: string
          sort_order?: number
          storage_path?: string
          supplier_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_offer_media_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          product_id: string
          sku: string | null
          stock_quantity: number
          supplier_organization_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          product_id: string
          sku?: string | null
          stock_quantity?: number
          supplier_organization_id: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          product_id?: string
          sku?: string | null
          stock_quantity?: number
          supplier_organization_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_organization_id_fkey"
            columns: ["supplier_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          delta: number
          id: string
          movement_type: string
          note: string | null
          order_id: string | null
          resulting_stock: number
          supplier_product_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delta: number
          id?: string
          movement_type: string
          note?: string | null
          order_id?: string | null
          resulting_stock: number
          supplier_product_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delta?: number
          id?: string
          movement_type?: string
          note?: string | null
          order_id?: string | null
          resulting_stock?: number
          supplier_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_stock_movements_supplier_product_id_fkey"
            columns: ["supplier_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_supplier_stock: {
        Args: {
          p_delta: number
          p_note?: string
          p_supplier_product_id: string
        }
        Returns: {
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          product_id: string
          sku: string | null
          stock_quantity: number
          supplier_organization_id: string
          unit_price: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "supplier_products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_dashboard_counts: {
        Args: never
        Returns: {
          active_products: number
          approved_suppliers: number
          pending_product_submissions: number
          pending_supplier_applications: number
          recent_orders_count: number
        }[]
      }
      approve_product_submission: {
        Args: { p_submission_id: string }
        Returns: string
      }
      approve_product_submission_link_existing: {
        Args: { p_existing_product_id: string; p_submission_id: string }
        Returns: string
      }
      approve_supplier_application: {
        Args: { p_application_id: string }
        Returns: string
      }
      checkout_cart: {
        Args: {
          p_cart_id: string
          p_contact_phone: string
          p_delivery_address: string
          p_note?: string
        }
        Returns: {
          order_id: string
          supplier_organization_id: string
          total: number
        }[]
      }
      create_organization_with_owner: {
        Args: {
          p_address?: string
          p_email?: string
          p_name: string
          p_phone?: string
          p_type: string
        }
        Returns: string
      }
      has_role_in_org: {
        Args: { p_organization_id: string; p_role: string }
        Returns: boolean
      }
      is_any_staff_member_of_org: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      is_member_of_org: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      reject_product_submission: {
        Args: { p_reason: string; p_submission_id: string }
        Returns: undefined
      }
      reject_supplier_application: {
        Args: { p_application_id: string; p_reason: string }
        Returns: undefined
      }
      update_order_status: {
        Args: { p_order_id: string; p_status: string }
        Returns: {
          buyer_organization_id: string
          contact_phone: string | null
          created_at: string
          created_by: string
          delivery_address: string | null
          id: string
          note: string | null
          status: string
          subtotal: number
          supplier_organization_id: string
          total: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
