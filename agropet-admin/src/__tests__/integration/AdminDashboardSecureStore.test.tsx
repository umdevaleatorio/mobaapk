import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../data/datasources/supabase/client';
import AdminDashboardScreen from '../../presentation/screens/admin/AdminDashboard';

// ── Mock do SecureStore ──
const mockTransactions = [
  { id: '1', type: 'sangria', amount: 50, description: 'Sangria Manual de Caixa', created_at: '2026-05-26T10:00:00Z' },
  { id: '2', type: 'suprimento', amount: 100, description: 'Suprimento Manual de Troco', created_at: '2026-05-26T10:05:00Z' },
  { id: '3', type: 'venda', amount: 80, description: 'Venda PDV', created_at: '2026-05-26T10:10:00Z' },
  { id: '4', type: 'sangria', amount: 30, description: 'Venda PDV (Cancelada)', created_at: '2026-05-26T10:15:00Z' },
];

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockImplementation((key: string) => {
    if (key === 'agropet_sangrias') {
      return Promise.resolve(JSON.stringify(mockTransactions));
    }
    return Promise.resolve(null);
  }),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// ── Mock do Supabase Client ──
jest.mock('../../data/datasources/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'orders') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({ data: [], error: null }),
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
  },
}));

// ── Mock do React Navigation e useFocusEffect ──
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn().mockReturnValue(jest.fn()),
    getParent: jest.fn().mockReturnValue({
      setOptions: jest.fn(),
    }),
  }),
  useFocusEffect: (cb: () => void) => {
    const react = require('react');
    react.useEffect(() => {
      cb();
    }, []);
  },
}));

// ── Mock do ThemeContext ──
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
      textDark: '#FFFFFF',
    },
    isDarkMode: true,
  }),
}));

// ── Mock dos Componentes que usam Native SVG ou Assets Complexos ──
jest.mock('../../presentation/components/AdminHeader', () => {
  const React = require('react');
  const { View } = require('react-native');
  return jest.fn().mockImplementation(() => <View />);
});

jest.mock('../../presentation/components/AdminUserMenu', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    AdminUserMenu: jest.fn().mockImplementation(() => <View />),
  };
});

describe('Fase 4: Teste de Armazenamento e Purga de Caixa (Prioridade 3) - AdminDashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Teste 11: deve carregar sangrias do SecureStore limpando/purgando transações com tipo venda', async () => {
    const { getByText, queryByText } = render(<AdminDashboardScreen />);

    // Verifica que as transações manuais (Sangria/Suprimento) foram carregadas e renderizadas na tela
    await waitFor(() => {
      expect(getByText('Sangria Manual de Caixa')).toBeTruthy();
      expect(getByText('Suprimento Manual de Troco')).toBeTruthy();
    });

    // Garante que as transações de PDV do tipo 'venda' ou com descrição de venda foram expurgadas
    expect(queryByText('Venda PDV')).toBeNull();
    expect(queryByText('Venda PDV (Cancelada)')).toBeNull();

    // Valida se o SecureStore foi consultado corretamente sob a chave correta
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('agropet_sangrias');
  });
});
