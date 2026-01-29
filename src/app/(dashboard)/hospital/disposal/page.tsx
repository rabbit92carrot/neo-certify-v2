'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCart, type CartItem } from '@/components/cart/use-cart';
import { createDisposalAction, getDisposalInventoryAction } from '../actions';

interface ProductOption {
  id: string;
  name: string;
}

const DISPOSAL_REASONS = [
  { value: 'EXPIRED', label: '유효기한 만료' },
  { value: 'DAMAGED', label: '파손' },
  { value: 'DEFECTIVE', label: '불량' },
  { value: 'OTHER', label: '기타' },
] as const;

export default function HospitalDisposalPage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [reasonType, setReasonType] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const cart = useCart();

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    setIsLoading(true);
    const result = await getDisposalInventoryAction();
    if (typeof result !== 'string' && result.success && result.data) {
      setProducts(
        (result.data as Array<{ id: string; name: string }>).map((p) => ({
          id: p.id,
          name: p.name,
        }))
      );
    }
    setIsLoading(false);
  }

  function handleAddProduct(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    cart.addItem({ productId: product.id, productName: product.name });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (cart.isEmpty) {
      toast.error('폐기 항목을 추가해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await createDisposalAction({
        disposalDate: formData.get('disposalDate') as string,
        disposalReasonType: reasonType as 'EXPIRED' | 'DAMAGED' | 'DEFECTIVE' | 'OTHER',
        disposalReasonCustom: (formData.get('disposalReasonCustom') as string) || undefined,
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });

      if (result.success && result.data) {
        toast.success(`폐기 완료 (${result.data.totalQuantity}개)`);
        cart.clearCart();
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error?.message ?? '폐기 처리에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">폐기 관리</h1>
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">폐기 관리</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>폐기 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disposalDate">폐기일</Label>
              <Input
                id="disposalDate"
                name="disposalDate"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>폐기 사유</Label>
              <Select value={reasonType} onValueChange={setReasonType} required>
                <SelectTrigger>
                  <SelectValue placeholder="사유를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {DISPOSAL_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {reasonType === 'OTHER' && (
              <div className="space-y-2">
                <Label htmlFor="disposalReasonCustom">기타 사유</Label>
                <Textarea id="disposalReasonCustom" name="disposalReasonCustom" placeholder="기타 사유를 입력하세요" />
              </div>
            )}

            {/* Product selector */}
            <div className="space-y-2">
              <Label>제품 추가</Label>
              <Select onValueChange={handleAddProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="제품을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cart items */}
            {cart.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">폐기 항목 ({cart.totalItems}개)</h4>
                {cart.items.map((item: CartItem) => (
                  <div key={item.productId} className="flex items-center gap-2 rounded-md border p-2">
                    <span className="flex-1 text-sm">{item.productName}</span>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        cart.updateQuantity(item.productId, parseInt(e.target.value, 10) || 1)
                      }
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => cart.removeItem(item.productId)}
                      aria-label="항목 삭제"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button type="submit" variant="destructive" disabled={isSubmitting || cart.isEmpty} className="w-full">
              {isSubmitting ? '처리 중...' : '폐기 등록'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
