'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// TODO: connect to verification service when API is available

interface VerificationResult {
  valid: boolean;
  code?: string;
  status?: string;
  productName?: string;
  lotNumber?: string;
  message?: string;
}

export default function AdminCodesPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleVerify() {
    if (!code.trim()) return;
    setIsLoading(true);

    // TODO: call actual verification action
    // For now, show placeholder
    setResult({
      valid: false,
      message: '검증 서비스가 준비 중입니다.',
    });
    setIsLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">가상코드 조회/검증</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>코드 검증</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">가상코드</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="가상코드를 입력하세요"
            />
          </div>

          <Button onClick={() => void handleVerify()} disabled={isLoading} className="w-full">
            {isLoading ? '검증 중...' : '검증'}
          </Button>

          {result && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">결과:</span>
                <Badge variant={result.valid ? 'default' : 'destructive'}>
                  {result.valid ? '유효' : '무효'}
                </Badge>
              </div>
              {result.message && <p className="text-sm text-gray-600">{result.message}</p>}
              {result.productName && (
                <p className="text-sm">제품: {result.productName}</p>
              )}
              {result.lotNumber && (
                <p className="text-sm">Lot: {result.lotNumber}</p>
              )}
              {result.status && (
                <p className="text-sm">상태: {result.status}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
