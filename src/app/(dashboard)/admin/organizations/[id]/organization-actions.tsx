'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  approveOrganizationAction,
  rejectOrganizationAction,
  changeOrganizationStatusAction,
} from '../../actions';

interface OrganizationActionsProps {
  organizationId: string;
  currentStatus: string;
}

export function OrganizationActions({ organizationId, currentStatus }: OrganizationActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleAction(action: () => Promise<{ success: boolean; error?: { message: string } | undefined }>, successMsg: string) {
    setIsLoading(true);
    try {
      const result = await action();
      if (result.success) {
        toast.success(successMsg);
        router.refresh();
      } else {
        toast.error(result.error?.message ?? '처리에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>조직 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentStatus === 'PENDING_APPROVAL' && (
          <>
            <Button
              className="w-full"
              onClick={() =>
                void handleAction(
                  () => approveOrganizationAction(organizationId),
                  '조직이 승인되었습니다.'
                )
              }
              disabled={isLoading}
            >
              승인
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() =>
                void handleAction(
                  () => rejectOrganizationAction(organizationId),
                  '조직이 거부되었습니다.'
                )
              }
              disabled={isLoading}
            >
              거부
            </Button>
          </>
        )}

        {currentStatus === 'ACTIVE' && (
          <Button
            variant="destructive"
            className="w-full"
            onClick={() =>
              void handleAction(
                () => changeOrganizationStatusAction(organizationId, 'SUSPENDED', '관리자 정지'),
                '조직이 정지되었습니다.'
              )
            }
            disabled={isLoading}
          >
            정지
          </Button>
        )}

        {currentStatus === 'SUSPENDED' && (
          <Button
            className="w-full"
            onClick={() =>
              void handleAction(
                () => changeOrganizationStatusAction(organizationId, 'ACTIVE'),
                '조직이 활성화되었습니다.'
              )
            }
            disabled={isLoading}
          >
            활성화
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/admin/organizations')}
        >
          목록으로
        </Button>
      </CardContent>
    </Card>
  );
}
