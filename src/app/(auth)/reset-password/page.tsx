'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const resetSchema = z.object({
  email: z.string().email('올바른 이메일을 입력해주세요'),
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: ResetFormData) {
    setError(null);
    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>이메일 전송 완료</CardTitle>
          <CardDescription>비밀번호 재설정 링크를 이메일로 보내드렸습니다.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            로그인으로 돌아가기
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>비밀번호 재설정</CardTitle>
        <CardDescription>가입하신 이메일을 입력하시면 재설정 링크를 보내드립니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이메일</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="이메일을 입력하세요" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? '전송 중...' : '재설정 링크 보내기'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          로그인으로 돌아가기
        </Link>
      </CardFooter>
    </Card>
  );
}
