import { notFound } from 'next/navigation';
import { getOrganizationAction } from '../../actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrganizationActions } from './organization-actions';

const ORG_TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: '제조사',
  DISTRIBUTOR: '유통사',
  HOSPITAL: '병원',
  ADMIN: '관리자',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: '승인 대기',
  ACTIVE: '활성',
  SUSPENDED: '정지',
  REJECTED: '거부',
};

export default async function AdminOrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getOrganizationAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const org = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{org.name}</h1>
        <Badge>{ORG_TYPE_LABELS[org.type] ?? org.type}</Badge>
        <Badge variant={org.status === 'ACTIVE' ? 'default' : 'secondary'}>
          {STATUS_LABELS[org.status] ?? org.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>조직 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">조직명</span>
              <p className="font-medium">{org.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">사업자번호</span>
              <p className="font-mono">{org.business_number}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">대표자</span>
              <p>{org.representative_name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">대표 연락처</span>
              <p>{org.representative_phone}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">주소</span>
              <p>{org.address}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">등록일</span>
              <p>{new Date(org.created_at).toLocaleString('ko-KR')}</p>
            </div>
          </CardContent>
        </Card>

        <OrganizationActions organizationId={org.id} currentStatus={org.status} />
      </div>
    </div>
  );
}
