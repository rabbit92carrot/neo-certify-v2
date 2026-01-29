import type { ColumnDef } from './data-table';

/**
 * Helper to create column definitions with type inference.
 */
export function createColumns<T>(columns: ColumnDef<T>[]): ColumnDef<T>[] {
  return columns;
}
