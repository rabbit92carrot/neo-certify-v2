'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerCredentialsSchema, type RegisterCredentialsData } from '@/schemas/auth';
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

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<RegisterCredentialsData>({
    resolver: zodResolver(registerCredentialsSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(data: RegisterCredentialsData) {
    setError(null);
    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>회원가입 완료</CardTitle>
          <CardDescription>
            이메일 확인 링크를 보내드렸습니다. 이메일을 확인해주세요.
          </CardDescription>
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
        <CardTitle>회원가입</CardTitle>
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="비밀번호를 입력하세요" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호 확인</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="비밀번호를 다시 입력하세요" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? '가입 중...' : '회원가입'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-sm">
        <p className="text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            로그인
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
