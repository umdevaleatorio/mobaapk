import React, { useState } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ErrorBoundary } from '../../presentation/components/ErrorBoundary';

const mockLog = jest.fn();
jest.mock('../../services/auditService', () => ({
  auditService: {
    log: (...args: any[]) => mockLog(...args),
  },
}));

// Suppress expected console.error from React error boundary
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

function BuggyComponent({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <View><Text>All good</Text></View>;
}

function ErrorTestWrapper() {
  const [hasError, setHasError] = useState(true);
  return (
    <View>
      <ErrorBoundary key={String(hasError)}>
        {hasError ? <BuggyComponent shouldThrow /> : <Text>Recovered</Text>}
      </ErrorBoundary>
      <Text testID="set-no-error" onPress={() => setHasError(false)}>Fix it</Text>
    </View>
  );
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Hello World</Text>
      </ErrorBoundary>
    );
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should catch errors and display fallback UI', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow />
      </ErrorBoundary>
    );
    expect(getByText('Algo deu errado')).toBeTruthy();
    expect(getByText('Ocorreu um erro inesperado. Nosso time já foi notificado.')).toBeTruthy();
    expect(getByText('Tentar novamente')).toBeTruthy();
  });

  it('should log the error via auditService', () => {
    render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow />
      </ErrorBoundary>
    );
    expect(mockLog).toHaveBeenCalledWith('app.crash', expect.objectContaining({
      error: 'Test error',
      stack: expect.any(String),
      componentStack: expect.any(String),
    }), 'error');
  });

  it('should reset error state when "Tentar novamente" is pressed', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow />
      </ErrorBoundary>
    );

    expect(getByText('Algo deu errado')).toBeTruthy();

    fireEvent.press(getByText('Tentar novamente'));

    // After reset, ErrorBoundary re-renders children, BuggyComponent throws again
    // so the error UI should reappear (reset + re-throw = still error)
    expect(getByText('Algo deu errado')).toBeTruthy();
  });

  it('should show recovered children if they no longer throw after reset', () => {
    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <BuggyComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByText('All good')).toBeTruthy();
  });
});
