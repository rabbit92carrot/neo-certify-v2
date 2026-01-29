import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getProductsAction } from '../actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SearchParams {
  page?: string;
  search?: string;
}

export default async function ManufacturerProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? '1', 10);
  const search = params.search;

  const result = await getProductsAction({ page, pageSize: 20, search });

  if (typeof result === 'string' || !result.success || !result.data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">제품 관리</h1>
        <p className="text-gray-500">제품 목록을 불러올 수 없습니다.</p>
      </div>
    );
  }

  const { items, meta } = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">제품 관리</h1>
        <Link href="/manufacturer/products/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            제품 등록
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>제품 목록 ({meta.total}건)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제품명</TableHead>
                <TableHead>모델명</TableHead>
                <TableHead>UDI-DI</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>등록일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                    등록된 제품이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link
                        href={`/manufacturer/products/${product.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell>{product.model_name}</TableCell>
                    <TableCell className="font-mono text-sm">{product.udi_di}</TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(product.created_at).toLocaleDateString('ko-KR')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Simple pagination */}
          {meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={`/manufacturer/products?page=${page - 1}${search ? `&search=${search}` : ''}`}>
                  <Button variant="outline" size="sm">이전</Button>
                </Link>
              )}
              <span className="text-sm text-gray-500">
                {page} / {meta.totalPages}
              </span>
              {meta.hasMore && (
                <Link href={`/manufacturer/products?page=${page + 1}${search ? `&search=${search}` : ''}`}>
                  <Button variant="outline" size="sm">다음</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
