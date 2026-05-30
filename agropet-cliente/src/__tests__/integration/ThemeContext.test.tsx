import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { Text, Button, View } from 'react-native';
import { ThemeProvider, useTheme, lightColors, darkColors } from '../../presentation/contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';

function ThemeConsumer() {
  const { isDarkMode, colors, toggleTheme } = useTheme();

  return (
    <View>
      <Text testID="theme-mode">{isDarkMode ? 'dark' : 'light'}</Text>
      <Text testID="theme-primary">{colors.primary}</Text>
      <Button title="Toggle Theme" onPress={toggleTheme} />
    </View>
  );
}

describe('ThemeContext & ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default light theme when SecureStore returns nothing', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('app_theme_dark');
      expect(getByTestId('theme-mode').props.children).toBe('light');
      expect(getByTestId('theme-primary').props.children).toBe(lightColors.primary);
    });
  });

  it('should initialize with dark theme when SecureStore returns "true"', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('true');

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('app_theme_dark');
      expect(getByTestId('theme-mode').props.children).toBe('dark');
      expect(getByTestId('theme-primary').props.children).toBe(darkColors.primary);
    });
  });

  it('should handle SecureStore.getItemAsync errors gracefully', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Load error'));

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await waitFor(() => {
      // Shoud fallback to default light theme
      expect(getByTestId('theme-mode').props.children).toBe('light');
    });
  });

  it('should toggle theme and save status in SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('false');

    const { getByText, getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByTestId('theme-mode').props.children).toBe('light');
    });

    // Toggle theme to dark
    await act(async () => {
      fireEvent.press(getByText('Toggle Theme'));
    });

    expect(getByTestId('theme-mode').props.children).toBe('dark');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('app_theme_dark', 'true');

    // Toggle theme back to light
    await act(async () => {
      fireEvent.press(getByText('Toggle Theme'));
    });

    expect(getByTestId('theme-mode').props.children).toBe('light');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('app_theme_dark', 'false');
  });

  it('should handle SecureStore.setItemAsync errors gracefully on toggleTheme', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('false');
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('Save error'));

    const { getByText, getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByTestId('theme-mode').props.children).toBe('light');
    });

    // Toggle theme should still flip the local state even if SecureStore fails
    await act(async () => {
      fireEvent.press(getByText('Toggle Theme'));
    });

    expect(getByTestId('theme-mode').props.children).toBe('dark');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('app_theme_dark', 'true');
  });
});
