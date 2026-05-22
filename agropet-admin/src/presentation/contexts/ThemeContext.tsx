import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../theme/colors';

type ThemeColors = typeof Colors & {
  backgroundLight: string;
  inputBackground: string;
  headerBackground: string;
  settingsCardBackground: string;
  textPrimary: string;
  accent: string;
};

interface ThemeContextData {
  isDarkMode: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const lightColors: ThemeColors = {
  ...Colors,
  background: '#F5F5F5',
  backgroundLight: '#F5F5F5',
  cardBackground: '#E3E4EB',
  inputBackground: '#F2F2F2',
  headerBackground: '#1C2434',
  settingsCardBackground: '#E3E4EB',
  textPrimary: '#1C2434',
  accent: '#042A7D',
};

export const darkColors: ThemeColors = {
  ...Colors,
  // Custom dark mappings
  white: '#18181C', // Inverted (fundo principal em páginas brancas virará escuro)
  background: '#18181C',
  backgroundLight: '#18181C',
  cardBackground: '#2E2E38',
  textDark: '#FFFFFF', // Inverted (azul escuro muda para branco)
  textWhite: '#FFFFFF', // Texto em cabeçalhos (permanece branco)
  textGray: '#A0A0A0',
  whiteSemiTransparent: 'rgba(25, 25, 30, 0.6)',
  whiteSemiTransparent80: 'rgba(25, 25, 30, 0.8)',
  
  // Custom theme colors
  inputBackground: '#2E2E38',
  headerBackground: '#000000',
  settingsCardBackground: '#1E1E24',
  textPrimary: '#FFFFFF',
  accent: '#4A90E2',
};

const THEME_STORE_KEY = 'app_theme_dark';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await SecureStore.getItemAsync(THEME_STORE_KEY);
        if (savedTheme === 'true') {
          setIsDarkMode(true);
        }
      } catch (e) {
        // Ignora erros
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const nextTheme = !isDarkMode;
      setIsDarkMode(nextTheme);
      await SecureStore.setItemAsync(THEME_STORE_KEY, nextTheme ? 'true' : 'false');
    } catch (e) {
      // Ignora erros
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
