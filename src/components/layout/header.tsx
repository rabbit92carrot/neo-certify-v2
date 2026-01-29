'use client';

import { Bell, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ORGANIZATION_TYPE_LABELS, type OrganizationType } from '@/constants';

interface HeaderProps {
  organizationType: OrganizationType;
  userName?: string;
  onMenuToggle?: () => void;
}

export function Header({ organizationType, userName = '사용자', onMenuToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 md:px-6">
      {/* 모바일 메뉴 토글 */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuToggle}
        aria-label="메뉴 열기"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* 모바일 로고 */}
      <div className="md:hidden">
        <span className="text-lg font-bold text-blue-700">네오인증서</span>
      </div>

      <div className="flex-1" />

      {/* 알림 */}
      <Button variant="ghost" size="icon" aria-label="알림">
        <Bell className="h-5 w-5" />
      </Button>

      {/* 사용자 메뉴 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="사용자 메뉴">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-gray-500">
                {ORGANIZATION_TYPE_LABELS[organizationType]}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form action="/api/auth/logout" method="POST" className="w-full">
              <button type="submit" className="w-full text-left text-red-600">
                로그아웃
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
