'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getActiveProductsAction, createLotAction } from '../actions';

interface ActiveProduct {
  id: string;
  name: string;
  model_name: string;
}

export default function ManufacturerProductionPage() {
  const [products, setProducts] = useState<ActiveProduct[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    setIsLoading(true);
    const result = await getActiveProductsAction();
    if (typeof result !== 'string' && result.success && result.data) {
      setProducts(result.data as ActiveProduct[]);
    }
    setIsLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await createLotAction(formData);

      if (result.success && result.data) {
        toast.success(`Lot이 생성되었습니다. (${result.data.totalQuantity}개 가상코드 생성)`);
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error?.message ?? 'Lot 생성에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">생산 관리</h1>
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">생산 관리</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Lot 생성</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productId">제품</Label>
              <Select name="productId" required>
                <SelectTrigger>
                  <SelectValue placeholder="제품을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.model_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lotNumber">Lot 번호</Label>
              <Input id="lotNumber" name="lotNumber" placeholder="LOT-2024-001" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">수량</Label>
              <Input id="quantity" name="quantity" type="number" min={1} max={100000} placeholder="100" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufactureDate">제조일</Label>
                <Input id="manufactureDate" name="manufactureDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">유효기한</Label>
                <Input id="expiryDate" name="expiryDate" type="date" required />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '처리 중...' : 'Lot 생성 및 가상코드 발급'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
