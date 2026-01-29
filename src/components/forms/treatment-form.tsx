'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { treatmentCreateSchema } from '@/schemas/treatment';
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
import { PatientAutocomplete } from '@/components/search/patient-autocomplete';
import { useCart, type CartItem } from '@/components/cart/use-cart';

type TreatmentFormData = z.infer<typeof treatmentCreateSchema>;

interface PatientSuggestion {
  id: string;
  phone: string;
  maskedPhone: string;
}

interface TreatmentFormProps {
  products: { id: string; name: string }[];
  searchPatients: (query: string) => Promise<PatientSuggestion[]>;
  onSubmit: (data: TreatmentFormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function TreatmentForm({
  products,
  searchPatients,
  onSubmit,
  isSubmitting = false,
}: TreatmentFormProps) {
  const cart = useCart();

  const form = useForm<TreatmentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(treatmentCreateSchema) as any,
    defaultValues: {
      patientPhone: '',
      treatmentDate: new Date().toISOString().slice(0, 10),
      items: [],
    },
  });

  function handlePatientSelect(patient: PatientSuggestion) {
    form.setValue('patientPhone', patient.phone);
  }

  function handleAddProduct(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    cart.addItem({ productId: product.id, productName: product.name });
  }

  function handleSubmit(data: TreatmentFormData) {
    void onSubmit({
      ...data,
      items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Patient search */}
        <FormField
          control={form.control}
          name="patientPhone"
          render={() => (
            <FormItem>
              <FormLabel>환자 전화번호</FormLabel>
              <FormControl>
                <PatientAutocomplete
                  onSelect={handlePatientSelect}
                  searchFn={searchPatients}
                  placeholder="전화번호로 검색"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Treatment date */}
        <FormField
          control={form.control}
          name="treatmentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>시술일</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">제품 추가</label>
          <Select onValueChange={handleAddProduct}>
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

        {/* Cart */}
        {cart.items.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">시술 항목 ({cart.totalItems}개)</h4>
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
        )}

        <Button type="submit" disabled={isSubmitting || cart.isEmpty} className="w-full">
          {isSubmitting ? '처리 중...' : '시술 등록'}
        </Button>
      </form>
    </Form>
  );
}
