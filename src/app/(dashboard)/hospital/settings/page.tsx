'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getHospitalProductsAction, setProductAliasAction } from '../actions';

interface KnownProduct {
  id: string;
  product_id: string;
  product_name?: string;
  alias: string | null;
}

export default function HospitalSettingsPage() {
  const [products, setProducts] = useState<KnownProduct[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aliasValue, setAliasValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    setIsLoading(true);
    const result = await getHospitalProductsAction();
    if (result.success && result.data) {
      setProducts(result.data as unknown as KnownProduct[]);
    }
    setIsLoading(false);
  }

  async function handleSaveAlias(productId: string) {
    const result = await setProductAliasAction(productId, aliasValue);
    if (result.success) {
      toast.success('별칭이 저장되었습니다.');
      setEditingId(null);
      void loadProducts();
    } else {
      toast.error(result.error?.message ?? '저장에 실패했습니다.');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">병원 설정</h1>
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">병원 설정</h1>

      <Card>
        <CardHeader>
          <CardTitle>등록 제품 / 별칭 관리</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제품명</TableHead>
                <TableHead>별칭</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-gray-500">
                    등록된 제품이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.product_name ?? p.product_id}</TableCell>
                    <TableCell>
                      {editingId === p.product_id ? (
                        <Input
                          value={aliasValue}
                          onChange={(e) => setAliasValue(e.target.value)}
                          placeholder="별칭 입력"
                          className="h-8 w-48"
                        />
                      ) : (
                        <span className="text-gray-600">{p.alias ?? '—'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === p.product_id ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => void handleSaveAlias(p.product_id)}>
                            저장
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            취소
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(p.product_id);
                            setAliasValue(p.alias ?? '');
                          }}
                        >
                          편집
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
