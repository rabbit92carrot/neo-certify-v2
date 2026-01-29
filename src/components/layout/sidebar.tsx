'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { NavItemIcon } from './nav-item-icon';
import { cn } from '@/lib/cn';
import {
  getNavigationItems,
  ORGANIZATION_TYPE_LABELS,
  type OrganizationType,
} from '@/constants';

interface SidebarProps {
  organizationType: OrganizationType;
  organizationName: string;
}

export function Sidebar({ organizationType, organizationName }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavigationItems(organizationType);

  return (
    <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r bg-white">
      {/* 로고 */}
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-blue-700">네오인증서</span>
          <span className="text-xs text-gray-500">
            {ORGANIZATION_TYPE_LABELS[organizationType]}
          </span>
        </div>
      </div>

      {/* 조직명 */}
      <div className="px-6 py-4 border-b">
        <p className="text-sm font-medium text-gray-900 truncate">{organizationName}</p>
      </div>

      {/* 네비게이션 */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <NavItemIcon iconName={item.icon} className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* 로그아웃 */}
      <div className="p-4">
        <form action="/api/auth/logout" method="POST">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-700 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            <span>로그아웃</span>
          </Button>
        </form>
      </div>
    </aside>
  );
}
