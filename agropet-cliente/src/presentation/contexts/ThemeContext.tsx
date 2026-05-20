import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../theme/colors';

type ThemeColors = typeof Colors & {
  inputBackground: string;
  headerBackground: string;
  settingsCardBackground: string;
  textPrimary: string;
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
  inputBackground: '#F2F2F2',
  headerBackground: '#1C2434',
  settingsCardBackground: '#1C2434',
  textPrimary: '#1C2434',
};

export const darkColors: ThemeColors = {
  ...Colors,
  // Custom dark mappings
  primary: '#EA841E',
  primaryDark: '#D85400',
  secondary: '#E3E4EB',
  accent: '#4A90E2',
  white: '#121212', // Inverted (fundo principal em páginas brancas virará escuro)
  background: '#121212',
  backgroundLight: '#18181C',
  cardBackground: '#2E2E38',
  cartIconBg: '#3E3E4A',
  buttonOrange: '#EA841E',
  buttonGreen: '#25BE36',
  textDark: '#FFFFFF', // Inverted
  textWhite: '#FFFFFF', // Texto em cabeçalhos (permanece branco)
  textLink: '#4A90E2',
  textGray: '#A0A0A0',
  textBrown: '#C0C0C8',
  textGreen: '#FF9E64',
  whiteSemiTransparent: 'rgba(25, 25, 30, 0.6)',
  success: '#25BE36',
  inactive: '#666666',
  
  // Custom theme colors
  inputBackground: '#2E2E38',
  headerBackground: '#121212',
  settingsCardBackground: '#1E1E24',
  textPrimary: '#FFFFFF',
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
