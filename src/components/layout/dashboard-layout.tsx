'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import type { OrganizationType } from '@/constants';

interface DashboardLayoutProps {
  organizationType: OrganizationType;
  organizationName: string;
  userName?: string;
  children: React.ReactNode;
}

export function DashboardLayout({
  organizationType,
  organizationName,
  userName,
  children,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <Sidebar organizationType={organizationType} organizationName={organizationName} />

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">네비게이션 메뉴</SheetTitle>
          <Sidebar organizationType={organizationType} organizationName={organizationName} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="md:pl-64">
        <Header
          organizationType={organizationType}
          userName={userName}
          onMenuToggle={() => setMobileOpen(true)}
        />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
