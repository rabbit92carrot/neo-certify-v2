import { AuthService } from '@/services/auth.service';
import * as inventoryService from '@/services/inventory.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function HospitalInventoryPage() {
  const user = await AuthService.getCurrentUser();
  if (!user.success || user.data!.organization.type !== 'HOSPITAL') {
    return <p className="text-gray-500">접근 권한이 없습니다.</p>;
  }

  const orgId = user.data!.organization.id;
  const result = await inventoryService.getInventorySummary(orgId);
  const items = result.success && result.data ? result.data : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">재고 현황</h1>

      <Card>
        <CardHeader>
          <CardTitle>제품별 재고</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제품명</TableHead>
                <TableHead>모델명</TableHead>
                <TableHead>UDI-DI</TableHead>
                <TableHead className="text-right">수량</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                    재고가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.modelName}</TableCell>
                    <TableCell className="font-mono text-sm">{item.udiDi}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {item.totalQuantity.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
