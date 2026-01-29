'use client';

import { useState } from 'react';
import { Search, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VerificationResult {
  valid: boolean;
  code?: string;
  status?: string;
  productName?: string;
  lotNumber?: string;
  manufacturerName?: string;
  manufactureDate?: string;
  expiryDate?: string;
  message?: string;
}

export default function PublicVerifyPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleVerify() {
    if (!code.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/verify?code=${encodeURIComponent(code.trim())}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setResult({
          valid: false,
          message: json.error?.message ?? '검증에 실패했습니다.',
        });
      } else {
        const d = json.data;
        setResult({
          valid: d.verified,
          code: d.code,
          status: d.status,
          message: d.verified ? '정품 인증이 확인되었습니다.' : `코드 상태: ${d.status}`,
          productName: d.treatment?.productName ?? undefined,
          manufacturerName: d.treatment?.manufacturerName ?? undefined,
          lotNumber: d.treatment?.lotNumber ?? undefined,
          expiryDate: d.treatment?.expiryDate ?? undefined,
        });
      }
    } catch {
      setResult({ valid: false, message: '서버에 연결할 수 없습니다.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">가상코드 검증</h1>
        <p className="mt-2 text-gray-600">
          의료기기의 가상코드를 입력하거나 QR코드를 스캔하여 제품 정보를 확인하세요.
        </p>
      </div>

      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>코드 검증</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual">
            <TabsList className="w-full">
              <TabsTrigger value="manual" className="flex-1">
                <Search className="mr-2 h-4 w-4" />
                수동 입력
              </TabsTrigger>
              <TabsTrigger value="qr" className="flex-1">
                <QrCode className="mr-2 h-4 w-4" />
                QR 스캔
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="code">가상코드</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="가상코드를 입력하세요"
                  onKeyDown={(e) => e.key === 'Enter' && void handleVerify()}
                />
              </div>
              <Button onClick={() => void handleVerify()} disabled={isLoading} className="w-full">
                {isLoading ? '검증 중...' : '검증하기'}
              </Button>
            </TabsContent>

            <TabsContent value="qr" className="pt-4">
              <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                  <QrCode className="mx-auto h-12 w-12" />
                  <p className="mt-2 text-sm">QR 스캔 기능은 준비 중입니다.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {result && (
            <div className="mt-6 rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">검증 결과:</span>
                <Badge variant={result.valid ? 'default' : 'destructive'}>
                  {result.valid ? '정품 인증' : '확인 불가'}
                </Badge>
              </div>
              {result.message && <p className="text-sm text-gray-600">{result.message}</p>}
              {result.productName && (
                <div>
                  <span className="text-sm text-gray-500">제품명</span>
                  <p className="font-medium">{result.productName}</p>
                </div>
              )}
              {result.manufacturerName && (
                <div>
                  <span className="text-sm text-gray-500">제조사</span>
                  <p>{result.manufacturerName}</p>
                </div>
              )}
              {result.lotNumber && (
                <div>
                  <span className="text-sm text-gray-500">Lot 번호</span>
                  <p className="font-mono">{result.lotNumber}</p>
                </div>
              )}
              {result.expiryDate && (
                <div>
                  <span className="text-sm text-gray-500">유효기한</span>
                  <p>{result.expiryDate}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
