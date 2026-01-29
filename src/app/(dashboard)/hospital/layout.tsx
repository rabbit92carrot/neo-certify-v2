'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout
      organizationType="HOSPITAL"
      organizationName="병원"
      userName="사용자"
    >
      {children}
    </DashboardLayout>
  );
}
