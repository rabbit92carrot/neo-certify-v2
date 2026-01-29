'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { shipmentCreateFormSchema } from '@/schemas/shipment';
import type { z } from 'zod';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCart, type CartItem } from '@/components/cart/use-cart';

type ShipmentFormData = z.infer<typeof shipmentCreateFormSchema>;

interface ShipmentFormProps {
  /** Available target organizations */
  organizations: { id: string; name: string }[];
  /** Available products */
  products: { id: string; name: string }[];
  onSubmit: (data: ShipmentFormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function ShipmentForm({
  organizations,
  products,
  onSubmit,
  isSubmitting = false,
}: ShipmentFormProps) {
  const cart = useCart();

  const form = useForm<ShipmentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(shipmentCreateFormSchema) as any,
    defaultValues: {
      toOrganizationId: '',
      items: [],
    },
  });

  function handleAddToCart(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    cart.addItem({ productId: product.id, productName: product.name });
  }

  function handleSubmit(data: ShipmentFormData) {
    void onSubmit({
      ...data,
      items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="toOrganizationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>출고 대상</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="조직을 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">제품 추가</label>
          <Select onValueChange={handleAddToCart}>
            <SelectTrigger>
              <SelectValue placeholder="제품을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cart items */}
        {cart.items.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">출고 항목 ({cart.totalItems}개)</h4>
            <div className="space-y-2">
              {cart.items.map((item: CartItem) => (
                <div key={item.productId} className="flex items-center gap-2 rounded-md border p-2">
                  <span className="flex-1 text-sm">{item.productName}</span>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      cart.updateQuantity(item.productId, parseInt(e.target.value, 10) || 1)
                    }
                    className="w-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => cart.removeItem(item.productId)}
                    aria-label="항목 삭제"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" disabled={isSubmitting || cart.isEmpty} className="w-full">
          {isSubmitting ? '처리 중...' : '출고 등록'}
        </Button>
      </form>
    </Form>
  );
}
