import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DistributorSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">유통사 설정</h1>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>조직 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            유통사 설정 기능은 준비 중입니다. 조직 정보 변경이 필요한 경우 관리자에게 문의하세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
