'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CursorPagination } from '@/components/ui/pagination';
import { cn } from '@/lib/cn';

// ============================================================================
// Column definition
// ============================================================================

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

// ============================================================================
// DataTable props
// ============================================================================

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Row key extractor */
  getRowKey: (row: T) => string;
  /** Empty state message */
  emptyMessage?: string;
  /** Sort state */
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnId: string) => void;
  /** Cursor pagination */
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = '데이터가 없습니다.',
  sortColumn,
  sortDirection,
  onSort,
  hasMore = false,
  onLoadMore,
  isLoading = false,
  className,
}: DataTableProps<T>) {
  function getCellValue(row: T, col: ColumnDef<T>): React.ReactNode {
    if (col.cell) return col.cell(row);
    if (col.accessorKey) return String(row[col.accessorKey] ?? '');
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.id}
                className={cn(
                  col.sortable && 'cursor-pointer select-none hover:text-gray-900',
                  col.className
                )}
                onClick={col.sortable && onSort ? () => onSort(col.id) : undefined}
              >
                <span className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortColumn === col.id && (
                    <span aria-hidden>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow key={getRowKey(row)}>
                {columns.map((col) => (
                  <TableCell key={col.id} className={col.className}>
                    {getCellValue(row, col)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {onLoadMore && (
        <CursorPagination hasMore={hasMore} onLoadMore={onLoadMore} isLoading={isLoading} />
      )}
    </div>
  );
}
