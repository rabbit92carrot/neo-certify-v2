import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">시스템 설정</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>시스템 환경</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            시스템 설정 기능은 준비 중입니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
