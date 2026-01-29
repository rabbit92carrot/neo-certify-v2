'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getTreatmentHistoryAction } from '../../actions';

interface TreatmentHistoryItem {
  id: string;
  treatment_date: string;
  patient_phone: string;
  is_recalled: boolean;
  created_at: string;
  totalQuantity: number;
  isRecallable: boolean;
  itemSummary: { productId: string; productName: string; quantity: number }[];
}

export default function HospitalTreatmentHistoryPage() {
  const [items, setItems] = useState<TreatmentHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadHistory(1);
  }, []);

  async function loadHistory(p: number) {
    setIsLoading(true);
    const result = await getTreatmentHistoryAction({ page: p, pageSize: 20 });
    if (typeof result !== 'string' && result.success && result.data) {
      const data = result.data as unknown as { items: TreatmentHistoryItem[]; meta: { hasMore: boolean } };
      if (p === 1) {
        setItems(data.items);
      } else {
        setItems((prev) => [...prev, ...data.items]);
      }
      setHasMore(data.meta.hasMore);
      setPage(p);
    }
    setIsLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">시술 이력</h1>

      <Card>
        <CardHeader>
          <CardTitle>시술 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시술일</TableHead>
                <TableHead>환자</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                    시술 이력이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.treatment_date}</TableCell>
                    <TableCell>{item.patient_phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</TableCell>
                    <TableCell className="text-right">{item.totalQuantity}</TableCell>
                    <TableCell>
                      <Badge variant={item.is_recalled ? 'destructive' : 'default'}>
                        {item.is_recalled ? '회수됨' : '정상'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(item.created_at).toLocaleString('ko-KR')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => void loadHistory(page + 1)}
                disabled={isLoading}
              >
                {isLoading ? '로딩 중...' : '더 보기'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
