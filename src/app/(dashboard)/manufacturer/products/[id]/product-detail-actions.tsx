'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { deactivateProductAction, activateProductAction } from '../../actions';

interface ProductDetailActionsProps {
  productId: string;
  isActive: boolean;
}

export function ProductDetailActions({ productId, isActive }: ProductDetailActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggleActive() {
    setIsLoading(true);
    try {
      const result = isActive
        ? await deactivateProductAction(productId, 'DISCONTINUED')
        : await activateProductAction(productId);

      if (result.success) {
        toast.success(isActive ? '제품이 비활성화되었습니다.' : '제품이 활성화되었습니다.');
        router.refresh();
      } else {
        toast.error(result.error?.message ?? '처리에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>제품 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant={isActive ? 'destructive' : 'default'}
          onClick={handleToggleActive}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? '처리 중...' : isActive ? '비활성화' : '활성화'}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/manufacturer/products')}
          className="w-full"
        >
          목록으로
        </Button>
      </CardContent>
    </Card>
  );
}
