'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function DistributorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      organizationType="DISTRIBUTOR"
      organizationName="유통사"
      userName="사용자"
    >
      {children}
    </DashboardLayout>
  );
}
