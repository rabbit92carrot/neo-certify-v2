import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable, type ColumnDef } from '@/components/data-table/data-table';

interface TestRow {
  id: string;
  name: string;
  value: number;
}

const columns: ColumnDef<TestRow>[] = [
  { id: 'id', header: 'ID', accessorKey: 'id' },
  { id: 'name', header: '이름', accessorKey: 'name' },
  { id: 'value', header: '값', accessorKey: 'value' },
];

const data: TestRow[] = [
  { id: '1', name: '항목A', value: 100 },
  { id: '2', name: '항목B', value: 200 },
  { id: '3', name: '항목C', value: 300 },
];

describe('DataTable', () => {
  it('헤더 렌더링', () => {
    render(<DataTable columns={columns} data={data} getRowKey={(r) => r.id} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('이름')).toBeInTheDocument();
    expect(screen.getByText('값')).toBeInTheDocument();
  });

  it('데이터 행 렌더링', () => {
    render(<DataTable columns={columns} data={data} getRowKey={(r) => r.id} />);
    expect(screen.getAllByText('항목A').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('항목B').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('항목C').length).toBeGreaterThanOrEqual(1);
  });

  it('빈 데이터 시 안내 표시', () => {
    render(<DataTable columns={columns} data={[]} getRowKey={(r) => r.id} />);
    expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument();
  });
});
