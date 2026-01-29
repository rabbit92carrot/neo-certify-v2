'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  listOrganizationsAction,
  approveOrganizationAction,
  rejectOrganizationAction,
} from '../actions';

const ORG_TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: '제조사',
  DISTRIBUTOR: '유통사',
  HOSPITAL: '병원',
  ADMIN: '관리자',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: '승인 대기',
  ACTIVE: '활성',
  SUSPENDED: '정지',
  REJECTED: '거부',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING_APPROVAL: 'outline',
  ACTIVE: 'default',
  SUSPENDED: 'destructive',
  REJECTED: 'secondary',
};

interface Organization {
  id: string;
  name: string;
  type: string;
  status: string;
  business_number: string;
  created_at: string;
}

export default function AdminOrganizationsPage() {
  const [items, setItems] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  async function loadOrganizations() {
    setIsLoading(true);
    const params: Record<string, unknown> = { page, pageSize: 20 };
    if (statusFilter !== 'ALL') {
      params.status = statusFilter;
    }
    const result = await listOrganizationsAction(params as Parameters<typeof listOrganizationsAction>[0]);
    if (result.success && result.data) {
      setItems(result.data.items as unknown as Organization[]);
      setTotal(result.data.meta.total);
    }
    setIsLoading(false);
  }

  async function handleApprove(id: string) {
    const result = await approveOrganizationAction(id);
    if (result.success) {
      toast.success('조직이 승인되었습니다.');
      void loadOrganizations();
    } else {
      toast.error(result.error?.message ?? '승인에 실패했습니다.');
    }
  }

  async function handleReject(id: string) {
    const result = await rejectOrganizationAction(id);
    if (result.success) {
      toast.success('조직이 거부되었습니다.');
      void loadOrganizations();
    } else {
      toast.error(result.error?.message ?? '거부에 실패했습니다.');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">조직 관리</h1>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
            <SelectItem value="PENDING_APPROVAL">승인 대기</SelectItem>
            <SelectItem value="ACTIVE">활성</SelectItem>
            <SelectItem value="SUSPENDED">정지</SelectItem>
            <SelectItem value="REJECTED">거부</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500">총 {total}건</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>조직 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>조직명</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>사업자번호</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                    조직이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell>{ORG_TYPE_LABELS[org.type] ?? org.type}</TableCell>
                    <TableCell className="font-mono text-sm">{org.business_number}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[org.status] ?? 'secondary'}>
                        {STATUS_LABELS[org.status] ?? org.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(org.created_at).toLocaleDateString('ko-KR')}</TableCell>
                    <TableCell>
                      {org.status === 'PENDING_APPROVAL' && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => void handleApprove(org.id)}>
                            승인
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void handleReject(org.id)}
                          >
                            거부
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)}>
                이전
              </Button>
            )}
            <span className="text-sm text-gray-500">페이지 {page}</span>
            {items.length === 20 && (
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
                다음
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
