import React from 'react';
import { render, act, waitFor, fireEvent } from '@testing-library/react-native';
import { Text, Button } from 'react-native';
import { ThemeProvider, useTheme } from '../../presentation/contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';

// Mock expo-secure-store in test scope
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

function ThemeConsumer() {
  const { isDarkMode, colors, toggleTheme } = useTheme();
  return (
    <>
      <Text testID="mode">{isDarkMode ? 'dark' : 'light'}</Text>
      <Text testID="bg">{colors.background}</Text>
      <Button title="Toggle" onPress={toggleTheme} testID="toggle-btn" />
    </>
  );
}

describe('ThemeContext (Admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with light theme by default if no preference is stored', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByTestId('mode').props.children).toBe('light');
      expect(getByTestId('bg').props.children).toBe('#F5F5F5');
    });
  });

  it('should initialize with dark theme if dark preference is stored', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('true');

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByTestId('mode').props.children).toBe('dark');
      expect(getByTestId('bg').props.children).toBe('#18181C');
    });
  });

  it('should handle SecureStore read error gracefully and default to light', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('SecureStore error'));

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByTestId('mode').props.children).toBe('light');
    });
  });

  it('should toggle theme active and save to SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('false');
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByTestId('mode').props.children).toBe('light');
    });

    const toggleBtn = getByTestId('toggle-btn');
    
    // Toggle to Dark
    await act(async () => {
      fireEvent.press(toggleBtn);
    });

    expect(getByTestId('mode').props.children).toBe('dark');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('app_theme_dark', 'true');

    // Toggle to Light
    await act(async () => {
      fireEvent.press(toggleBtn);
    });

    expect(getByTestId('mode').props.children).toBe('light');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('app_theme_dark', 'false');
  });

  it('should handle SecureStore write error gracefully when toggling', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('false');
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('Write error'));

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByTestId('mode').props.children).toBe('light');
    });

    const toggleBtn = getByTestId('toggle-btn');
    
    await act(async () => {
      fireEvent.press(toggleBtn);
    });

    expect(getByTestId('mode').props.children).toBe('dark');
  });
});
