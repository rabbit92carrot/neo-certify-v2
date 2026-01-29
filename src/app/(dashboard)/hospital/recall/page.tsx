'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { recallTreatmentAction } from '../actions';

export default function HospitalRecallPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const treatmentId = formData.get('treatmentId') as string;
      const reason = formData.get('reason') as string;

      if (!treatmentId || !reason) {
        toast.error('모든 필드를 입력해주세요.');
        return;
      }

      const result = await recallTreatmentAction(treatmentId, reason);
      if (result.success) {
        toast.success('시술이 회수되었습니다.');
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error?.message ?? '회수에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">회수 관리</h1>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">시술 등록 후 24시간 이내에만 회수가 가능합니다.</span>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>시술 회수</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="treatmentId">시술 ID</Label>
              <Input
                id="treatmentId"
                name="treatmentId"
                placeholder="회수할 시술 ID를 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">회수 사유</Label>
              <Textarea
                id="reason"
                name="reason"
                placeholder="회수 사유를 입력하세요"
                required
              />
            </div>

            <Button type="submit" variant="destructive" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '처리 중...' : '시술 회수'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
