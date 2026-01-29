'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSettingsAction, updateSettingsAction } from '../actions';

export default function ManufacturerSettingsPage() {
  const [hmacSecret, setHmacSecret] = useState('');
  const [codePrefix, setCodePrefix] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    const result = await getSettingsAction();
    if (result.success && result.data) {
      setHmacSecret(result.data.hmac_secret ?? '');
      setCodePrefix(result.data.code_prefix ?? '');
    }
    setIsLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (hmacSecret) formData.set('hmacSecret', hmacSecret);
      if (codePrefix) formData.set('codePrefix', codePrefix);

      const result = await updateSettingsAction(formData);
      if (result.success) {
        toast.success('설정이 저장되었습니다.');
      } else {
        toast.error(result.error?.message ?? '저장에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">제조사 설정</h1>
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">제조사 설정</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>가상코드 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hmacSecret">HMAC Secret</Label>
              <Input
                id="hmacSecret"
                type="password"
                value={hmacSecret}
                onChange={(e) => setHmacSecret(e.target.value)}
                placeholder="HMAC 비밀키"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codePrefix">코드 접두사</Label>
              <Input
                id="codePrefix"
                value={codePrefix}
                onChange={(e) => setCodePrefix(e.target.value)}
                placeholder="예: MFG"
                maxLength={10}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '저장 중...' : '설정 저장'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
