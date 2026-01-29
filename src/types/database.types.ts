/**
 * Extended Database Types
 *
 * auto-generated 타입을 확장합니다.
 * MergeDeep로 커스텀 RPC 함수 등을 안전하게 추가합니다.
 */

import type { MergeDeep } from 'type-fest';
import type { Database as DatabaseGenerated } from './database-generated.types';

export type { Json } from './database-generated.types';

/**
 * 커스텀 RPC 함수 및 확장 타입
 */
type DatabaseOverrides = {
  public: {
    Functions: {
      get_user_organization_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_user_organization_type: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      add_quantity_to_lot: {
        Args: { p_lot_id: string; p_additional_quantity: number };
        Returns: number;
      };
      process_shipment: {
        Args: {
          p_to_org_id: string;
          p_to_org_type: string;
          p_items: unknown;
        };
        Returns: {
          shipment_batch_id: string | null;
          total_quantity: number;
          error_code: string | null;
          error_message: string | null;
        }[];
      };
      process_treatment: {
        Args: {
          p_patient_phone: string;
          p_treatment_date: string;
          p_items: unknown;
        };
        Returns: {
          treatment_id: string | null;
          total_quantity: number;
          error_code: string | null;
          error_message: string | null;
        }[];
      };
      process_disposal: {
        Args: {
          p_disposal_date: string;
          p_disposal_reason_type: string;
          p_disposal_reason_custom: string | null;
          p_items: unknown;
        };
        Returns: {
          disposal_id: string | null;
          total_quantity: number;
          error_code: string | null;
          error_message: string | null;
        }[];
      };
      process_return: {
        Args: {
          p_shipment_batch_id: string;
          p_reason: string;
          p_product_quantities: unknown;
        };
        Returns: {
          success: boolean;
          returned_count: number;
          new_batch_id: string | null;
          error_code: string | null;
          error_message: string | null;
        }[];
      };
      process_recall: {
        Args: {
          p_shipment_batch_id: string;
          p_reason: string;
        };
        Returns: {
          success: boolean;
          recalled_count: number;
          error_code: string | null;
          error_message: string | null;
        }[];
      };
      recall_treatment: {
        Args: {
          p_treatment_id: string;
          p_reason: string;
        };
        Returns: {
          success: boolean;
          recalled_count: number;
          error_code: string | null;
          error_message: string | null;
        }[];
      };
    };
  };
};

export type Database = MergeDeep<DatabaseGenerated, DatabaseOverrides>;

// Convenience re-exports
export type { Tables, TablesInsert, TablesUpdate, Enums } from './database-generated.types';
