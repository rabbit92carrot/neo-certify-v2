import { Package, Building2, FileText, AlertCircle } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminStatisticsPage() {
  // TODO: fetch real stats from admin dashboard service
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">통계 대시보드</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="총 조직 수" value="—" icon={<Building2 className="h-4 w-4" />} />
        <StatCard title="총 가상코드" value="—" icon={<Package className="h-4 w-4" />} />
        <StatCard title="총 거래 이력" value="—" icon={<FileText className="h-4 w-4" />} />
        <StatCard title="회수 건수" value="—" icon={<AlertCircle className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>상세 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            상세 통계 기능은 준비 중입니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
