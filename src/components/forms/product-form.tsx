'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productCreateSchema } from '@/schemas/product';
import type { z } from 'zod';
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

type ProductFormData = z.infer<typeof productCreateSchema>;

interface ProductFormProps {
  defaultValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function ProductForm({ defaultValues, onSubmit, isSubmitting = false }: ProductFormProps) {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productCreateSchema),
    defaultValues: {
      name: '',
      udiDi: '',
      modelName: '',
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>제품명</FormLabel>
              <FormControl>
                <Input placeholder="제품명을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="udiDi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UDI-DI</FormLabel>
              <FormControl>
                <Input placeholder="UDI-DI를 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="modelName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>모델명</FormLabel>
              <FormControl>
                <Input placeholder="모델명을 입력하세요" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? '처리 중...' : defaultValues ? '수정' : '등록'}
        </Button>
      </form>
    </Form>
  );
}
