'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TreatmentForm } from '@/components/forms/treatment-form';
import {
  createTreatmentAction,
  searchPatientsAction,
} from '../actions';
import { getDisposalInventoryAction } from '../actions';

interface ProductOption {
  id: string;
  name: string;
}

export default function HospitalTreatmentPage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const searchPatients = useCallback(async (query: string) => {
    const result = await searchPatientsAction(query);
    if (typeof result !== 'string' && result.success && result.data) {
      // Service returns string[] (phone numbers)
      return (result.data as string[]).map((phone, i) => ({
        id: `patient-${i}`,
        phone,
        maskedPhone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      }));
    }
    return [];
  }, []);

  async function handleSubmit(data: {
    patientPhone: string;
    treatmentDate: string;
    items: { productId: string; quantity: number }[];
  }) {
    setIsSubmitting(true);
    try {
      const result = await createTreatmentAction(data);
      if (result.success && result.data) {
        toast.success(`시술 등록 완료 (${result.data.totalQuantity}개)`);
      } else {
        toast.error(result.error?.message ?? '시술 등록에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">시술 기록</h1>
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">시술 기록</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>시술 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <TreatmentForm
            products={products}
            searchPatients={searchPatients}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
