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
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      damaged_items: {
        Row: {
          condition: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          reason: string | null
          registered_by: string | null
          warehouse_id: string | null
        }
        Insert: {
          condition: string
          created_at?: string
          id?: string
          product_id: string
          quantity: number
          reason?: string | null
          registered_by?: string | null
          warehouse_id?: string | null
        }
        Update: {
          condition?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          registered_by?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "damaged_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damaged_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      document_template_fields: {
        Row: {
          cell_reference: string | null
          created_at: string
          field_key: string
          field_label: string
          id: string
          is_required: boolean
          table_column: string | null
          template_id: string
        }
        Insert: {
          cell_reference?: string | null
          created_at?: string
          field_key: string
          field_label: string
          id?: string
          is_required?: boolean
          table_column?: string | null
          template_id: string
        }
        Update: {
          cell_reference?: string | null
          created_at?: string
          field_key?: string
          field_label?: string
          id?: string
          is_required?: boolean
          table_column?: string | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_template_fields_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          builder_config: Json
          checksum: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          description: string | null
          file_extension: string
          file_size: number
          id: string
          is_active: boolean
          mapping_config: Json
          mime_type: string
          name: string
          original_file_name: string
          source_type: string
          storage_bucket: string
          storage_path: string
          type: string
          updated_at: string
          version: string
        }
        Insert: {
          builder_config?: Json
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          file_extension: string
          file_size: number
          id?: string
          is_active?: boolean
          mapping_config?: Json
          mime_type: string
          name: string
          original_file_name: string
          source_type?: string
          storage_bucket?: string
          storage_path: string
          type: string
          updated_at?: string
          version?: string
        }
        Update: {
          builder_config?: Json
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          file_extension?: string
          file_size?: number
          id?: string
          is_active?: boolean
          mapping_config?: Json
          mime_type?: string
          name?: string
          original_file_name?: string
          source_type?: string
          storage_bucket?: string
          storage_path?: string
          type?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      equipment_types: {
        Row: {
          ca_number: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          ca_number?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          ca_number?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          created_at: string
          deleted_at: string | null
          document_type: string
          file_extension: string
          generated_at: string
          generated_by: string | null
          generated_file_name: string
          id: string
          metadata: Json
          mime_type: string
          original_file_name: string
          staff_id: string
          status: string
          storage_bucket: string
          storage_path: string
          template_id: string | null
          template_name_snapshot: string
          template_type: string
          updated_at: string
          version_used: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          document_type: string
          file_extension: string
          generated_at?: string
          generated_by?: string | null
          generated_file_name: string
          id?: string
          metadata?: Json
          mime_type: string
          original_file_name: string
          staff_id: string
          status?: string
          storage_bucket?: string
          storage_path: string
          template_id?: string | null
          template_name_snapshot: string
          template_type: string
          updated_at?: string
          version_used: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          document_type?: string
          file_extension?: string
          generated_at?: string
          generated_by?: string | null
          generated_file_name?: string
          id?: string
          metadata?: Json
          mime_type?: string
          original_file_name?: string
          staff_id?: string
          status?: string
          storage_bucket?: string
          storage_path?: string
          template_id?: string | null
          template_name_snapshot?: string
          template_type?: string
          updated_at?: string
          version_used?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      job_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          item_number: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          item_number?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          item_number?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_models: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          item_number: string | null
          min_quantity: number
          name: string
          sku: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          item_number?: string | null
          min_quantity?: number
          name: string
          sku?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          item_number?: string | null
          min_quantity?: number
          name?: string
          sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_models_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_purchases: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          registered_by: string | null
          warehouse_id: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          registered_by?: string | null
          warehouse_id?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          registered_by?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_purchases_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          ca_expiry: string | null
          ca_number: string | null
          category_id: string | null
          contract_id: string | null
          created_at: string
          current_stock: number | null
          description: string | null
          id: string
          item_number: string | null
          min_stock: number | null
          name: string
          registered_by: string | null
          sku: string | null
          unit: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          brand?: string | null
          ca_expiry?: string | null
          ca_number?: string | null
          category_id?: string | null
          contract_id?: string | null
          created_at?: string
          current_stock?: number | null
          description?: string | null
          id?: string
          item_number?: string | null
          min_stock?: number | null
          name: string
          registered_by?: string | null
          sku?: string | null
          unit: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          brand?: string | null
          ca_expiry?: string | null
          ca_number?: string | null
          category_id?: string | null
          contract_id?: string | null
          created_at?: string
          current_stock?: number | null
          description?: string | null
          id?: string
          item_number?: string | null
          min_stock?: number | null
          name?: string
          registered_by?: string | null
          sku?: string | null
          unit?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          contract_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_number: string
          requester_id: string | null
          status: string
          title: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_number: string
          requester_id?: string | null
          status?: string
          title: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_number?: string
          requester_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          address: string | null
          admission_date: string | null
          allowed_categories: string[] | null
          contract_id: string | null
          cost_center: string | null
          cpf: string
          created_at: string
          created_by: string | null
          department: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          registration_number: string
          role: string
          role_id: string | null
          status: string | null
          training_date: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          allowed_categories?: string[] | null
          contract_id?: string | null
          cost_center?: string | null
          cpf: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          registration_number: string
          role: string
          role_id?: string | null
          status?: string | null
          training_date?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          allowed_categories?: string[] | null
          contract_id?: string | null
          cost_center?: string | null
          cpf?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          registration_number?: string
          role?: string
          role_id?: string | null
          status?: string | null
          training_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_equipment: {
        Row: {
          created_at: string
          equipment_type_id: string
          id: string
          issue_date: string
          notes: string | null
          quantity: number
          return_date: string | null
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipment_type_id: string
          id?: string
          issue_date?: string
          notes?: string | null
          quantity?: number
          return_date?: string | null
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipment_type_id?: string
          id?: string
          issue_date?: string
          notes?: string | null
          quantity?: number
          return_date?: string | null
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_equipment_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_equipment_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_trainings: {
        Row: {
          completion_date: string
          created_at: string | null
          id: string
          staff_id: string | null
          training_id: string | null
        }
        Insert: {
          completion_date: string
          created_at?: string | null
          id?: string
          staff_id?: string | null
          training_id?: string | null
        }
        Update: {
          completion_date?: string
          created_at?: string | null
          id?: string
          staff_id?: string | null
          training_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_trainings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_trainings_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          clerk_id: string | null
          created_at: string
          destination_warehouse_id: string | null
          id: string
          is_manual_override: boolean | null
          material_kind: string | null
          movement_group_id: string | null
          notes: string | null
          product_id: string | null
          quantity: number
          registered_by: string | null
          signature_url: string | null
          staff_id: string | null
          status: string | null
          transport_staff_id: string | null
          type: string
          warehouse_id: string | null
        }
        Insert: {
          clerk_id?: string | null
          created_at?: string
          destination_warehouse_id?: string | null
          id?: string
          is_manual_override?: boolean | null
          material_kind?: string | null
          movement_group_id?: string | null
          notes?: string | null
          product_id?: string | null
          quantity: number
          registered_by?: string | null
          signature_url?: string | null
          staff_id?: string | null
          status?: string | null
          transport_staff_id?: string | null
          type: string
          warehouse_id?: string | null
        }
        Update: {
          clerk_id?: string | null
          created_at?: string
          destination_warehouse_id?: string | null
          id?: string
          is_manual_override?: boolean | null
          material_kind?: string | null
          movement_group_id?: string | null
          notes?: string | null
          product_id?: string | null
          quantity?: number
          registered_by?: string | null
          signature_url?: string | null
          staff_id?: string | null
          status?: string | null
          transport_staff_id?: string | null
          type?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_clerk_id_fkey"
            columns: ["clerk_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_destination_warehouse_id_fkey"
            columns: ["destination_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transport_staff_id_fkey"
            columns: ["transport_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
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
      warehouses: {
        Row: {
          contract_id: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_stock: {
        Args: { p_delta: number; p_product_id: string }
        Returns: number
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
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
      app_role: "admin" | "operador" | "programador"
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
      app_role: ["admin", "operador", "programador"],
    },
  },
} as const
