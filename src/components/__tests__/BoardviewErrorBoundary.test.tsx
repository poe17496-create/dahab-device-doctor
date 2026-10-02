import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BoardviewErrorBoundary } from '../BoardviewErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Boardview error');
  }
  return <div>Boardview working</div>;
};

describe('BoardviewErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <BoardviewErrorBoundary>
        <div>Boardview content</div>
      </BoardviewErrorBoundary>
    );
    expect(screen.getByText('Boardview content')).toBeInTheDocument();
  });

  it('catches errors and displays boardview-specific error UI', () => {
    render(
      <BoardviewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BoardviewErrorBoundary>
    );

    expect(screen.getByText(/محاكي البوردفيو غير متاح مؤقتاً/i)).toBeInTheDocument();
    expect(screen.getByText(/إعادة التحميل/i)).toBeInTheDocument();
    // Use getAllByText since the text appears in both description and button
    expect(screen.getAllByText(/رفع ملف محلي/i)).toHaveLength(2);
  });

  it('displays appropriate error message', () => {
    render(
      <BoardviewErrorBoundary>
        <ThrowError shouldThrow={true} />
      </BoardviewErrorBoundary>
    );

    expect(screen.getByText(/حدث خطأ في عرض البوردة/i)).toBeInTheDocument();
  });
});
