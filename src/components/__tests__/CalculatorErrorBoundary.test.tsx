import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalculatorErrorBoundary } from '../CalculatorErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Calculator error');
  }
  return <div>Calculator working</div>;
};

describe('CalculatorErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <CalculatorErrorBoundary>
        <div>Calculator content</div>
      </CalculatorErrorBoundary>
    );
    expect(screen.getByText('Calculator content')).toBeInTheDocument();
  });

  it('catches errors and displays calculator-specific error UI', () => {
    render(
      <CalculatorErrorBoundary>
        <ThrowError shouldThrow={true} />
      </CalculatorErrorBoundary>
    );

    expect(screen.getByText(/حاسبة حقن الفولت غير متاحة مؤقتاً/i)).toBeInTheDocument();
    expect(screen.getByText(/إعادة التحميل/i)).toBeInTheDocument();
  });

  it('displays appropriate error message', () => {
    render(
      <CalculatorErrorBoundary>
        <ThrowError shouldThrow={true} />
      </CalculatorErrorBoundary>
    );

    expect(screen.getByText(/حدث خطأ في الحاسبة/i)).toBeInTheDocument();
  });
});
