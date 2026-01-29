'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface InquiryResult {
  found: boolean;
  treatments?: {
    id: string;
    treatmentDate: string;
    hospitalName: string;
    productName: string;
    quantity: number;
  }[];
  message?: string;
}

export default function PublicInquiryPage() {
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<InquiryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleInquiry() {
    if (!phone.trim()) return;
    setIsLoading(true);

    // TODO: call public inquiry API
    setResult({
      found: false,
      message: '이력 조회 서비스가 준비 중입니다. 전화번호를 입력하면 시술 이력을 확인할 수 있습니다.',
    });
    setIsLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">이력 조회</h1>
        <p className="mt-2 text-gray-600">
          시술에 사용된 의료기기 이력을 조회할 수 있습니다.
        </p>
      </div>

      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>환자 이력 조회</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              onKeyDown={(e) => e.key === 'Enter' && void handleInquiry()}
            />
            <p className="text-xs text-gray-500">시술 시 등록된 전화번호를 입력하세요.</p>
          </div>

          <Button onClick={() => void handleInquiry()} disabled={isLoading} className="w-full">
            {isLoading ? '조회 중...' : '이력 조회'}
          </Button>

          {result && (
            <div className="mt-4 space-y-3">
              {result.message && (
                <p className="text-sm text-gray-600">{result.message}</p>
              )}

              {result.found && result.treatments && result.treatments.length > 0 && (
                <div className="space-y-2">
                  {result.treatments.map((t) => (
                    <div key={t.id} className="rounded-lg border p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{t.productName}</span>
                        <Badge variant="outline">{t.quantity}개</Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {t.hospitalName} · {t.treatmentDate}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {result.found && (!result.treatments || result.treatments.length === 0) && (
                <p className="text-center text-gray-500">시술 이력이 없습니다.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
