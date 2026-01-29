import { Package, Truck, Warehouse, FileText } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';

export default function HospitalDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="총 제품" value="—" icon={<Package className="h-4 w-4" />} />
        <StatCard title="총 출고" value="—" icon={<Truck className="h-4 w-4" />} />
        <StatCard title="재고" value="—" icon={<Warehouse className="h-4 w-4" />} />
        <StatCard title="이력" value="—" icon={<FileText className="h-4 w-4" />} />
      </div>
    </div>
  );
}
