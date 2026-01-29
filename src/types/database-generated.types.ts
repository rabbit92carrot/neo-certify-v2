/**
 * Auto-generated Supabase types placeholder
 * 
 * 실제 운영에서는 `npx supabase gen types typescript` 명령으로 생성합니다.
 * 이 파일은 initial.sql 스키마를 기반으로 수동 작성한 타입입니다.
 * 
 * DO NOT EDIT MANUALLY in production - regenerate with Supabase CLI
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          type: Database['public']['Enums']['org_type'];
          name: string;
          email: string;
          business_number: string;
          business_license_url: string | null;
          representative_name: string;
          representative_phone: string;
          address: string;
          status: Database['public']['Enums']['org_status'];
          auth_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: Database['public']['Enums']['org_type'];
          name: string;
          email: string;
          business_number: string;
          business_license_url?: string | null;
          representative_name: string;
          representative_phone: string;
          address: string;
          status?: Database['public']['Enums']['org_status'];
          auth_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: Database['public']['Enums']['org_type'];
          name?: string;
          email?: string;
          business_number?: string;
          business_license_url?: string | null;
          representative_name?: string;
          representative_phone?: string;
          address?: string;
          status?: Database['public']['Enums']['org_status'];
          auth_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          udi_di: string;
          model_name: string;
          is_active: boolean;
          deactivation_reason: Database['public']['Enums']['deactivation_reason_type'] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          udi_di: string;
          model_name: string;
          is_active?: boolean;
          deactivation_reason?: Database['public']['Enums']['deactivation_reason_type'] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          udi_di?: string;
          model_name?: string;
          is_active?: boolean;
          deactivation_reason?: Database['public']['Enums']['deactivation_reason_type'] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      lots: {
        Row: {
          id: string;
          product_id: string;
          lot_number: string;
          quantity: number;
          manufacture_date: string;
          expiry_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          lot_number: string;
          quantity: number;
          manufacture_date: string;
          expiry_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          lot_number?: string;
          quantity?: number;
          manufacture_date?: string;
          expiry_date?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lots_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      patients: {
        Row: {
          id: string;
          phone_number: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone_number: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      virtual_codes: {
        Row: {
          id: string;
          code: string;
          lot_id: string;
          status: Database['public']['Enums']['code_status'];
          owner_org_id: string | null;
          owner_patient_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          lot_id: string;
          status?: Database['public']['Enums']['code_status'];
          owner_org_id?: string | null;
          owner_patient_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          lot_id?: string;
          status?: Database['public']['Enums']['code_status'];
          owner_org_id?: string | null;
          owner_patient_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'virtual_codes_lot_id_fkey';
            columns: ['lot_id'];
            isOneToOne: false;
            referencedRelation: 'lots';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'virtual_codes_owner_org_id_fkey';
            columns: ['owner_org_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'virtual_codes_owner_patient_id_fkey';
            columns: ['owner_patient_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id'];
          },
        ];
      };
      shipment_batches: {
        Row: {
          id: string;
          from_organization_id: string;
          to_organization_id: string;
          to_organization_type: Database['public']['Enums']['org_type'];
          shipment_date: string;
          is_recalled: boolean;
          recall_reason: string | null;
          recall_date: string | null;
          is_return_batch: boolean;
          parent_batch_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_organization_id: string;
          to_organization_id: string;
          to_organization_type: Database['public']['Enums']['org_type'];
          shipment_date?: string;
          is_recalled?: boolean;
          recall_reason?: string | null;
          recall_date?: string | null;
          is_return_batch?: boolean;
          parent_batch_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_organization_id?: string;
          to_organization_id?: string;
          to_organization_type?: Database['public']['Enums']['org_type'];
          shipment_date?: string;
          is_recalled?: boolean;
          recall_reason?: string | null;
          recall_date?: string | null;
          is_return_batch?: boolean;
          parent_batch_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shipment_batches_from_organization_id_fkey';
            columns: ['from_organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipment_batches_to_organization_id_fkey';
            columns: ['to_organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipment_batches_parent_batch_id_fkey';
            columns: ['parent_batch_id'];
            isOneToOne: false;
            referencedRelation: 'shipment_batches';
            referencedColumns: ['id'];
          },
        ];
      };
      shipment_details: {
        Row: {
          id: string;
          shipment_batch_id: string;
          virtual_code_id: string;
        };
        Insert: {
          id?: string;
          shipment_batch_id: string;
          virtual_code_id: string;
        };
        Update: {
          id?: string;
          shipment_batch_id?: string;
          virtual_code_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'shipment_details_shipment_batch_id_fkey';
            columns: ['shipment_batch_id'];
            isOneToOne: false;
            referencedRelation: 'shipment_batches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shipment_details_virtual_code_id_fkey';
            columns: ['virtual_code_id'];
            isOneToOne: false;
            referencedRelation: 'virtual_codes';
            referencedColumns: ['id'];
          },
        ];
      };
      treatment_records: {
        Row: {
          id: string;
          hospital_id: string;
          patient_phone: string;
          treatment_date: string;
          is_recalled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          patient_phone: string;
          treatment_date: string;
          is_recalled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          hospital_id?: string;
          patient_phone?: string;
          treatment_date?: string;
          is_recalled?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'treatment_records_hospital_id_fkey';
            columns: ['hospital_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      treatment_details: {
        Row: {
          id: string;
          treatment_id: string;
          virtual_code_id: string;
        };
        Insert: {
          id?: string;
          treatment_id: string;
          virtual_code_id: string;
        };
        Update: {
          id?: string;
          treatment_id?: string;
          virtual_code_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'treatment_details_treatment_id_fkey';
            columns: ['treatment_id'];
            isOneToOne: false;
            referencedRelation: 'treatment_records';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'treatment_details_virtual_code_id_fkey';
            columns: ['virtual_code_id'];
            isOneToOne: false;
            referencedRelation: 'virtual_codes';
            referencedColumns: ['id'];
          },
        ];
      };
      disposal_records: {
        Row: {
          id: string;
          hospital_id: string;
          disposal_date: string;
          disposal_reason_type: Database['public']['Enums']['disposal_reason'];
          disposal_reason_custom: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          disposal_date: string;
          disposal_reason_type: Database['public']['Enums']['disposal_reason'];
          disposal_reason_custom?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          hospital_id?: string;
          disposal_date?: string;
          disposal_reason_type?: Database['public']['Enums']['disposal_reason'];
          disposal_reason_custom?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'disposal_records_hospital_id_fkey';
            columns: ['hospital_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      disposal_details: {
        Row: {
          id: string;
          disposal_id: string;
          virtual_code_id: string;
        };
        Insert: {
          id?: string;
          disposal_id: string;
          virtual_code_id: string;
        };
        Update: {
          id?: string;
          disposal_id?: string;
          virtual_code_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'disposal_details_disposal_id_fkey';
            columns: ['disposal_id'];
            isOneToOne: false;
            referencedRelation: 'disposal_records';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'disposal_details_virtual_code_id_fkey';
            columns: ['virtual_code_id'];
            isOneToOne: false;
            referencedRelation: 'virtual_codes';
            referencedColumns: ['id'];
          },
        ];
      };
      histories: {
        Row: {
          id: string;
          virtual_code_id: string;
          action_type: Database['public']['Enums']['action_type'];
          from_org_id: string | null;
          from_patient_id: string | null;
          to_org_id: string | null;
          to_patient_id: string | null;
          shipment_batch_id: string | null;
          treatment_id: string | null;
          disposal_id: string | null;
          is_recall: boolean;
          recall_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          virtual_code_id: string;
          action_type: Database['public']['Enums']['action_type'];
          from_org_id?: string | null;
          from_patient_id?: string | null;
          to_org_id?: string | null;
          to_patient_id?: string | null;
          shipment_batch_id?: string | null;
          treatment_id?: string | null;
          disposal_id?: string | null;
          is_recall?: boolean;
          recall_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          virtual_code_id?: string;
          action_type?: Database['public']['Enums']['action_type'];
          from_org_id?: string | null;
          from_patient_id?: string | null;
          to_org_id?: string | null;
          to_patient_id?: string | null;
          shipment_batch_id?: string | null;
          treatment_id?: string | null;
          disposal_id?: string | null;
          is_recall?: boolean;
          recall_reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'histories_virtual_code_id_fkey';
            columns: ['virtual_code_id'];
            isOneToOne: false;
            referencedRelation: 'virtual_codes';
            referencedColumns: ['id'];
          },
        ];
      };
      hospital_known_patients: {
        Row: {
          id: string;
          hospital_id: string;
          patient_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          patient_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          hospital_id?: string;
          patient_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'hospital_known_patients_hospital_id_fkey';
            columns: ['hospital_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'hospital_known_patients_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id'];
          },
        ];
      };
      hospital_known_products: {
        Row: {
          id: string;
          hospital_id: string;
          product_id: string;
          alias: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          hospital_id: string;
          product_id: string;
          alias?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          hospital_id?: string;
          product_id?: string;
          alias?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'hospital_known_products_hospital_id_fkey';
            columns: ['hospital_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'hospital_known_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      manufacturer_settings: {
        Row: {
          id: string;
          organization_id: string;
          hmac_secret: string;
          code_prefix: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          hmac_secret: string;
          code_prefix?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          hmac_secret?: string;
          code_prefix?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'manufacturer_settings_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: true;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_messages: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string | null;
          template_code: string;
          phone: string;
          variables: Json;
          status: string;
          retry_count: number;
          aligo_mid: string | null;
          error_msg: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id?: string | null;
          template_code: string;
          phone: string;
          variables?: Json;
          status?: string;
          retry_count?: number;
          aligo_mid?: string | null;
          error_msg?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string | null;
          template_code?: string;
          phone?: string;
          variables?: Json;
          status?: string;
          retry_count?: number;
          aligo_mid?: string | null;
          error_msg?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_messages_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_messages_patient_id_fkey';
            columns: ['patient_id'];
            isOneToOne: false;
            referencedRelation: 'patients';
            referencedColumns: ['id'];
          },
        ];
      };
      organization_alerts: {
        Row: {
          id: string;
          organization_id: string;
          alert_type: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          alert_type: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          alert_type?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'organization_alerts_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_organization_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      org_type: 'MANUFACTURER' | 'DISTRIBUTOR' | 'HOSPITAL' | 'ADMIN';
      org_status: 'PENDING_APPROVAL' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
      code_status: 'IN_STOCK' | 'USED' | 'DISPOSED';
      action_type:
        | 'MANUFACTURED'
        | 'SHIPPED'
        | 'RECEIVED'
        | 'TREATED'
        | 'DISPOSED'
        | 'RETURNED'
        | 'RECALL_TREATED';
      deactivation_reason_type: 'DISCONTINUED' | 'SAFETY_ISSUE' | 'OTHER';
      disposal_reason: 'EXPIRED' | 'DAMAGED' | 'DEFECTIVE' | 'OTHER';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types
type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;
