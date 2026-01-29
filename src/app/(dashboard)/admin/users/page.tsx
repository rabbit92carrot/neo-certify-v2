import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">사용자 관리</h1>

      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            사용자 관리 기능은 준비 중입니다. 현재 사용자는 조직 단위로 관리됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
