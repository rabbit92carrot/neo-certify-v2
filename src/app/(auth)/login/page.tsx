'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/schemas/auth';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const ROLE_DASHBOARD_MAP: Record<string, string> = {
  MANUFACTURER: '/manufacturer/dashboard',
  DISTRIBUTOR: '/distributor/dashboard',
  HOSPITAL: '/hospital/dashboard',
  ADMIN: '/admin/dashboard',
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginFormData) {
    setError(null);
    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다');
      return;
    }

    // 조직 정보 조회하여 역할별 대시보드로 리다이렉트
    const { data: org } = await supabase
      .from('organizations')
      .select('type, status')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (!org) {
      setError('조직 정보를 찾을 수 없습니다');
      await supabase.auth.signOut();
      return;
    }

    if (org.status !== 'ACTIVE') {
      const statusMessages: Record<string, string> = {
        PENDING_APPROVAL: '승인 대기 중인 계정입니다',
        SUSPENDED: '정지된 계정입니다',
        REJECTED: '승인이 거부된 계정입니다',
      };
      setError(statusMessages[org.status] ?? '로그인할 수 없는 계정 상태입니다');
      await supabase.auth.signOut();
      return;
    }

    const dashboardPath = ROLE_DASHBOARD_MAP[org.type] ?? '/';
    router.push(dashboardPath);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>로그인</CardTitle>
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
                    <Input type="password" placeholder="비밀번호를 입력하세요" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <Link href="/reset-password" className="text-blue-600 hover:underline">
          비밀번호를 잊으셨나요?
        </Link>
        <p className="text-gray-500">
          계정이 없으신가요?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            회원가입
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
