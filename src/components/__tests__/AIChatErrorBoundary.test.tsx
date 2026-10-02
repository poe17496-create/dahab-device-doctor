import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIChatErrorBoundary } from '../AIChatErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('AI Chat error');
  }
  return <div>AI Chat working</div>;
};

describe('AIChatErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <AIChatErrorBoundary>
        <div>AI Chat content</div>
      </AIChatErrorBoundary>
    );
    expect(screen.getByText('AI Chat content')).toBeInTheDocument();
  });

  it('catches errors and displays AI-specific error UI', () => {
    render(
      <AIChatErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AIChatErrorBoundary>
    );

    expect(screen.getByText(/مساعد الذكاء الاصطناعي غير متاح مؤقتاً/i)).toBeInTheDocument();
    expect(screen.getByText(/إعادة تشغيل المساعد/i)).toBeInTheDocument();
  });

  it('displays appropriate error message', () => {
    render(
      <AIChatErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AIChatErrorBoundary>
    );

    expect(screen.getByText(/حدث خطأ في المحادثة/i)).toBeInTheDocument();
  });
});
