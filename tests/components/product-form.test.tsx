import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductForm } from '@/components/forms/product-form';

describe('ProductForm', () => {
  it('폼 필드가 렌더링됨', () => {
    render(<ProductForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('제품명')).toBeInTheDocument();
    expect(screen.getByLabelText('UDI-DI')).toBeInTheDocument();
    expect(screen.getByLabelText('모델명')).toBeInTheDocument();
  });

  it('기본값이 반영됨', () => {
    render(
      <ProductForm
        onSubmit={vi.fn()}
        defaultValues={{ name: '테스트제품', udiDi: 'UDI-001', modelName: 'Model-A' }}
      />,
    );

    expect(screen.getByDisplayValue('테스트제품')).toBeInTheDocument();
    expect(screen.getByDisplayValue('UDI-001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Model-A')).toBeInTheDocument();
  });

  it('제출 버튼 존재', () => {
    render(<ProductForm onSubmit={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    const submitBtn = buttons.find((b) => b.textContent === '등록');
    expect(submitBtn).toBeDefined();
  });

  it('isSubmitting 시 버튼 비활성화', () => {
    render(<ProductForm onSubmit={vi.fn()} isSubmitting />);
    const buttons = screen.getAllByRole('button');
    const submitBtn = buttons.find((b) => b.textContent === '처리 중...');
    expect(submitBtn).toBeDefined();
    expect(submitBtn).toBeDisabled();
  });
});
