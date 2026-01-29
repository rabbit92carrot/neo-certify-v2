'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { returnShipmentAction } from '../actions';

export default function DistributorReturnsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const shipmentBatchId = formData.get('shipmentBatchId') as string;
      const reason = formData.get('reason') as string;

      if (!shipmentBatchId || !reason) {
        toast.error('모든 필드를 입력해주세요.');
        return;
      }

      const result = await returnShipmentAction(shipmentBatchId, reason);
      if (result.success && result.data) {
        toast.success(`반품 완료 (${result.data.returnedCount}건)`);
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error?.message ?? '반품 처리에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">반품 관리</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>반품 등록</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipmentBatchId">출고 배치 ID</Label>
              <Input
                id="shipmentBatchId"
                name="shipmentBatchId"
                placeholder="반품할 출고 배치 ID를 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">반품 사유</Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="반품 사유를 입력하세요"
                required
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '처리 중...' : '반품 등록'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
