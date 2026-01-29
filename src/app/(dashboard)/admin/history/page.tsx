'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getAdminHistoryAction } from '../actions';
import { ACTION_TYPE_LABELS } from '@/constants';

interface HistoryItem {
  id: string;
  actionType: string;
  actionTypeLabel: string;
  createdAt: string;
  isRecall: boolean;
  totalQuantity: number;
  fromOwner?: { name: string };
  toOwner?: { name: string };
}

export default function AdminHistoryPage() {
  const [organizationId, setOrganizationId] = useState('');
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<{ cursorTime?: string; cursorKey?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch() {
    if (!organizationId.trim()) return;
    setIsLoading(true);
    setItems([]);
    const result = await getAdminHistoryAction(organizationId.trim(), { limit: 50 });
    if (result.success && result.data) {
      setItems(result.data.items as unknown as HistoryItem[]);
      setHasMore(result.data.meta.hasMore);
      setNextCursor({
        cursorTime: result.data.meta.nextCursorTime,
        cursorKey: result.data.meta.nextCursorKey,
      });
    }
    setIsLoading(false);
  }

  async function handleLoadMore() {
    setIsLoading(true);
    const result = await getAdminHistoryAction(organizationId.trim(), {
      limit: 50,
      ...nextCursor,
    });
    if (result.success && result.data) {
      setItems((prev) => [...prev, ...(result.data!.items as unknown as HistoryItem[])]);
      setHasMore(result.data.meta.hasMore);
      setNextCursor({
        cursorTime: result.data.meta.nextCursorTime,
        cursorKey: result.data.meta.nextCursorKey,
      });
    }
    setIsLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">전체 이력 조회</h1>

      <Card>
        <CardHeader>
          <CardTitle>조직별 이력 조회</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="orgId">조직 ID</Label>
              <Input
                id="orgId"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                placeholder="조직 UUID를 입력하세요"
              />
            </div>
            <Button onClick={() => void handleSearch()} disabled={isLoading}>
              {isLoading ? '검색 중...' : '조회'}
            </Button>
          </div>

          {items.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>유형</TableHead>
                  <TableHead>일시</TableHead>
                  <TableHead>출발</TableHead>
                  <TableHead>도착</TableHead>
                  <TableHead className="text-right">수량</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {ACTION_TYPE_LABELS[item.actionType] ?? item.actionType}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleString('ko-KR')}</TableCell>
                    <TableCell>{item.fromOwner?.name ?? '—'}</TableCell>
                    <TableCell>{item.toOwner?.name ?? '—'}</TableCell>
                    <TableCell className="text-right">{item.totalQuantity}</TableCell>
                    <TableCell>
                      {item.isRecall && (
                        <Badge variant="destructive">회수</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => void handleLoadMore()} disabled={isLoading}>
                {isLoading ? '로딩 중...' : '더 보기'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
