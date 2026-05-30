import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../../presentation/screens/client/HomeScreen';
import { supabase } from '../../data/datasources/supabase/client';

// ── Mocks ──
jest.mock('../../data/datasources/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'settings') {
        return {
          select: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: { show_greeting_bar: true, is_open: true }, error: null }),
        };
      }
      if (table === 'products') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
      };
    }),
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnValue({
        subscribe: jest.fn().mockReturnValue({}),
      }),
    }),
    removeChannel: jest.fn(),
  },
}));

// Mock do ThemeContext do Cliente
jest.mock('../../presentation/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      white: '#FFFFFF',
      background: '#0B0D19',
      primary: '#FF0000',
      text: '#FFFFFF',
      border: '#2C2D3A',
      card: '#16192B',
      headerBackground: '#16192B',
    },
    isDarkMode: false,
  }),
}));

// Mock do React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    addListener: jest.fn().mockReturnValue(jest.fn()),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock do expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('true'),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock de Fontes ou Componentes que usam Native SVG ou Assets Complexos
jest.mock('../../presentation/components/CatalogHeader', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CatalogHeader: jest.fn().mockImplementation(() => <View />),
    CatalogFilter: jest.fn().mockImplementation(() => <View />),
  };
});

jest.mock('../../presentation/contexts/FilterContext', () => ({
  useFilter: () => ({
    activeCategories: [],
    setActiveCategories: jest.fn(),
    searchText: '',
    setSearchText: jest.fn(),
  }),
  isProductInCategories: () => true,
}));

jest.mock('../../presentation/contexts/CartContext', () => {
  return {
    CartContext: {
      ...jest.requireActual('react').createContext({
        cartItems: [],
        addToCart: jest.fn(),
      }),
    },
  };
});

jest.mock('../../presentation/contexts/AuthContext', () => {
  return {
    AuthContext: {
      ...jest.requireActual('react').createContext({
        session: null,
        user: null,
        isLoading: false,
      }),
    },
  };
});

describe('Fase 4: Lógica de Memory Leaks e Limpeza de Recursos (Prioridade 3) - Client HomeScreen Timers', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Teste 12: deve criar intervalos de saudação/status no mount e limpá-los corretamente com clearInterval no unmount', () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    // 1. Renderiza a tela principal (HomeScreen)
    const { unmount } = render(<HomeScreen />);

    // 2. Garante que os intervalos globais de saudação e relógio de status da loja foram criados
    expect(setIntervalSpy).toHaveBeenCalled();
    const intervalIds = setIntervalSpy.mock.results.map(r => r.value);

    // 3. Desmonta a tela do cliente da árvore de visualização (Simula navegação de saída / logout)
    unmount();

    // 4. Verifica que os mesmos identificadores criados foram cancelados para impedir memory leak no Android
    expect(clearIntervalSpy).toHaveBeenCalled();
    intervalIds.forEach(id => {
      expect(clearIntervalSpy).toHaveBeenCalledWith(id);
    });

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });
});
