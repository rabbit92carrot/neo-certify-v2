'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function ManufacturerLayout({ children }: { children: React.ReactNode }) {
  // TODO: fetch from auth context
  return (
    <DashboardLayout
      organizationType="MANUFACTURER"
      organizationName="제조사"
      userName="사용자"
    >
      {children}
    </DashboardLayout>
  );
}
