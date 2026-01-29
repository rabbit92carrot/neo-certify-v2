'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm } from '@/components/forms/product-form';
import { createProductAction } from '../../actions';

export default function ManufacturerProductNewPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: { name: string; udiDi: string; modelName: string }) {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('name', data.name);
      formData.set('udiDi', data.udiDi);
      formData.set('modelName', data.modelName);

      const result = await createProductAction(formData);
      if (result.success) {
        toast.success('제품이 등록되었습니다.');
        router.push('/manufacturer/products');
      } else {
        toast.error(result.error?.message ?? '제품 등록에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">제품 등록</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>새 제품 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </CardContent>
      </Card>
    </div>
  );
}
