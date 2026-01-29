'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShipmentForm } from '@/components/forms/shipment-form';
import {
  createDistributorShipmentAction,
  getDistributorShipmentTargetsAction,
  getDistributorAvailableProductsAction,
} from '../actions';

interface OrgOption {
  id: string;
  name: string;
}

interface ProductOption {
  id: string;
  name: string;
}

export default function DistributorShipmentPage() {
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const [targetsResult, productsResult] = await Promise.all([
      getDistributorShipmentTargetsAction(),
      getDistributorAvailableProductsAction(),
    ]);

    if ('success' in targetsResult && targetsResult.success && targetsResult.data) {
      setOrganizations(
        (targetsResult.data as Array<{ id: string; name: string }>).map((o) => ({
          id: o.id,
          name: o.name,
        }))
      );
    }

    if ('success' in productsResult && productsResult.success && productsResult.data) {
      setProducts(
        (productsResult.data as Array<{ id: string; name: string }>).map((p) => ({
          id: p.id,
          name: p.name,
        }))
      );
    }

    setIsLoading(false);
  }

  async function handleSubmit(data: {
    toOrganizationId: string;
    items: { productId: string; quantity: number }[];
  }) {
    setIsSubmitting(true);
    try {
      const result = await createDistributorShipmentAction(data);
      if (result.success && result.data) {
        toast.success(`재출고 완료 (${result.data.totalQuantity}개)`);
      } else {
        toast.error(result.error?.message ?? '재출고에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">재출고</h1>
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">재출고</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>재출고 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <ShipmentForm
            organizations={organizations}
            products={products}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
