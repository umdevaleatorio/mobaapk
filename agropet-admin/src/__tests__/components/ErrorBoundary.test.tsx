import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../../presentation/components/ErrorBoundary';

const mockLog = jest.fn();
jest.mock('../../services/auditService', () => ({
  log: jest.fn(),
  healthCheck: jest.fn(),
  auditService: {
    log: (...args: unknown[]) => mockLog(...args),
  },
}));

const ThrowSimulator = () => {
  throw new Error('test crash');
};

describe('ErrorBoundary', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text testID="child">Hello World</Text>
      </ErrorBoundary>
    );
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should catch rendering error and show fallback UI', () => {
    const { getByText, queryByTestId } = render(
      <ErrorBoundary>
        <ThrowSimulator />
      </ErrorBoundary>
    );

    expect(getByText('Algo deu errado')).toBeTruthy();
    expect(getByText('Tentar novamente')).toBeTruthy();
    expect(queryByTestId('child')).toBeNull();
  });

  it('should log the error via auditService when error is caught', () => {
    render(
      <ErrorBoundary>
        <ThrowSimulator />
      </ErrorBoundary>
    );

    expect(mockLog).toHaveBeenCalledWith('app.crash', {
      error: 'test crash',
      stack: expect.any(String),
      componentStack: expect.any(String),
    }, 'error');
  });

  it('should reset error state when handleReset is triggered (child re-throws, boundary re-catches)', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowSimulator />
      </ErrorBoundary>
    );

    expect(getByText('Algo deu errado')).toBeTruthy();

    fireEvent.press(getByText('Tentar novamente'));

    expect(getByText('Algo deu errado')).toBeTruthy();
    expect(getByText('Tentar novamente')).toBeTruthy();
  });

  it('should not log when no error occurs', () => {
    render(
      <ErrorBoundary>
        <Text>Safe content</Text>
      </ErrorBoundary>
    );

    expect(mockLog).not.toHaveBeenCalled();
  });
});
