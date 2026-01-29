import { notFound } from 'next/navigation';
import * as productService from '@/services/product.service';
import { AuthService } from '@/services/auth.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductDetailActions } from './product-detail-actions';

export default async function ManufacturerProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await AuthService.getCurrentUser();
  if (!user.success || user.data!.organization.type !== 'MANUFACTURER') {
    notFound();
  }

  const orgId = user.data!.organization.id;
  const result = await productService.getProduct(orgId, id);

  if (!result.success || !result.data) {
    notFound();
  }

  const product = result.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <Badge variant={product.is_active ? 'default' : 'secondary'}>
          {product.is_active ? '활성' : '비활성'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>제품 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">제품명</span>
              <p className="font-medium">{product.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">모델명</span>
              <p className="font-medium">{product.model_name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">UDI-DI</span>
              <p className="font-mono">{product.udi_di}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">등록일</span>
              <p>{new Date(product.created_at).toLocaleDateString('ko-KR')}</p>
            </div>
          </CardContent>
        </Card>

        <ProductDetailActions productId={product.id} isActive={product.is_active} />
      </div>
    </div>
  );
}
