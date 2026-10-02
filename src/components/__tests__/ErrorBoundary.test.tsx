import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary, { ComponentErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('catches errors and displays error UI', () => {
    const onErrorSpy = vi.fn();
    render(
      <ErrorBoundary onError={onErrorSpy}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/درع التعافي الذكي/i)).toBeInTheDocument();
    expect(onErrorSpy).toHaveBeenCalled();
  });

  it('displays custom fallback when provided', () => {
    const customFallback = <div>Custom error UI</div>;
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
  });

  it('displays component name in error UI', () => {
    render(
      <ErrorBoundary component="Test Component">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Test Component/i)).toBeInTheDocument();
  });
});

describe('ComponentErrorBoundary', () => {
  it('wraps children with ErrorBoundary', () => {
    render(
      <ComponentErrorBoundary component="Test">
        <div>Child content</div>
      </ComponentErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});
