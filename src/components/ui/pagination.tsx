'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, type ButtonProps } from '@/components/ui/button';

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="페이지네이션"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}
Pagination.displayName = 'Pagination';

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={cn('flex flex-row items-center gap-1', className)} {...props} />;
}
PaginationContent.displayName = 'PaginationContent';

function PaginationItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={cn('', className)} {...props} />;
}
PaginationItem.displayName = 'PaginationItem';

interface PaginationButtonProps extends ButtonProps {
  isActive?: boolean;
}

function PaginationButton({ className, isActive, size = 'icon', ...props }: PaginationButtonProps) {
  return (
    <Button
      aria-current={isActive ? 'page' : undefined}
      variant={isActive ? 'outline' : 'ghost'}
      size={size}
      className={className}
      {...props}
    />
  );
}
PaginationButton.displayName = 'PaginationButton';

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationButton>) {
  return (
    <PaginationButton aria-label="이전 페이지" size="default" className={cn('gap-1 pl-2.5', className)} {...props}>
      <ChevronLeft className="h-4 w-4" />
      <span>이전</span>
    </PaginationButton>
  );
}
PaginationPrevious.displayName = 'PaginationPrevious';

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationButton>) {
  return (
    <PaginationButton aria-label="다음 페이지" size="default" className={cn('gap-1 pr-2.5', className)} {...props}>
      <span>다음</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationButton>
  );
}
PaginationNext.displayName = 'PaginationNext';

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span aria-hidden className={cn('flex h-9 w-9 items-center justify-center', className)} {...props}>
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">더 많은 페이지</span>
    </span>
  );
}
PaginationEllipsis.displayName = 'PaginationEllipsis';

// ============================================================================
// 커서 페이지네이션용 컴포넌트
// ============================================================================

interface CursorPaginationProps {
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading?: boolean;
  className?: string;
}

function CursorPagination({ hasMore, onLoadMore, isLoading = false, className }: CursorPaginationProps) {
  if (!hasMore) return null;

  return (
    <div className={cn('flex justify-center py-4', className)}>
      <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
        {isLoading ? '로딩 중...' : '더 보기'}
      </Button>
    </div>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationButton,
  PaginationNext,
  PaginationPrevious,
  CursorPagination,
};
