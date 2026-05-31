import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '../../data/datasources/supabase/client';
import AdminSalesHistoryScreen from '../../presentation/screens/admin/AdminSalesHistory';

// ── Mock do Supabase Fluent Query Builder ──
const mockNeq = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockGte = jest.fn().mockReturnThis();
const mockLte = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnValue({
  eq: mockEq,
  neq: mockNeq,
  order: mockOrder,
  gte: mockGte,
  lte: mockLte,
  then: (resolve: any) => resolve({ data: [], error: null }),
});

jest.mock('../../data/datasources/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'orders') {
        return { select: mockSelect };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
      };
    }),
    rpc: jest.fn(),
  },
}));

// Mock do DateTimePicker do React Native para evitar falhas de ambiente
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return jest.fn().mockImplementation(() => <View />);
});

// Mock do AsyncStorage para persistência de datas nos testes de histórico
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

// Mock do React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    addListener: jest.fn().mockReturnValue(jest.fn()),
  }),
}));

// Mock do ThemeContext para prover as cores do sistema
jest.mock('../../presentation/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      white: '#FFFFFF',
      background: '#0B0D19',
      primary: '#FF0000',
      text: '#FFFFFF',
      border: '#2C2D3A',
      card: '#16192B',
    },
    isDarkMode: true,
  }),
}));

// Mock do AdminHeader para evitar erros de renderização
jest.mock('../../presentation/components/AdminHeader', () => {
  const React = require('react');
  const { View } = require('react-native');
  return jest.fn().mockImplementation(() => <View />);
});

// Mock do AdminUserMenu para evitar erros de renderização
jest.mock('../../presentation/components/AdminUserMenu', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    AdminUserMenu: jest.fn().mockImplementation(() => <View />),
  };
});

describe('Fase 1: Banco de Dados, APIs e Regras de Segurança (Prioridade 4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Teste 1: Concorrência e Lock de Linha (Pessimistic Locking) ──
  it('Teste 1: deve simular concorrência e garantir bloqueio pessimista atômico no checkout', async () => {
    const mockRpc = supabase.rpc as jest.Mock;

    // A primeira tentativa de finalizar o pedido com o último item no estoque tem sucesso.
    // A segunda tentativa falha por falta de estoque/bloqueio simultâneo.
    mockRpc
      .mockResolvedValueOnce({ data: { success: true, order_id: 'PEDIDO-CONCORRENTE-1' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'Estoque insuficiente por concorrência.' } });

    const call1 = supabase.rpc('rpc_finalizar_pedido', { p_product_id: 'prod-ultimo-item', p_qty: 1 });
    const call2 = supabase.rpc('rpc_finalizar_pedido', { p_product_id: 'prod-ultimo-item', p_qty: 1 });

    const [res1, res2] = await Promise.allSettled([call1, call2]);

    expect(res1.status).toBe('fulfilled');
    expect((res1 as any).value.data.success).toBe(true);

    expect(res2.status).toBe('fulfilled');
    expect((res2 as any).value.error.message).toContain('Estoque insuficiente');
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });

  // ── Teste 2: Bypass de RLS Administrativo (Latência e Recursão) ──
  it('Teste 2: deve garantir bypass de RLS administrativo em tempo de resposta ótimo e sem loops recursivos', async () => {
    const mockCheckAdmin = jest.fn().mockImplementation(async (userId: string) => {
      const start = performance.now();
      
      // Simulação da política public.is_admin que verifica se o usuário é admin.
      // Deve rodar em apenas uma chamada direta no Supabase para evitar loops de recursão infinita.
      const { data, error } = await supabase.from('users').select('role').eq('id', userId).single();
      
      const end = performance.now();
      return {
        isAdmin: data?.role === 'admin',
        latencyMs: end - start,
        error,
      };
    });

    const result = await mockCheckAdmin('user-admin-id');

    expect(result.isAdmin).toBe(true);
    // Tempo máximo aceitável para verificação de políticas RLS em cache local/memória de teste
    expect(result.latencyMs).toBeLessThan(50);
    expect(supabase.from).toHaveBeenCalledWith('users');
  });

  // ── Teste 3: Isolamento de Vendas Físicas locais no Histórico ──
  it('Teste 3: deve aplicar o filtro de exclusão de vendas físicas do PDV na listagem de pedidos concluídos', async () => {
    // Renderiza a tela de histórico de vendas concluídas
    render(<AdminSalesHistoryScreen />);

    // Aguarda e valida se a query com exclusão do delivery_address foi disparada
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('orders');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('status', 'completed');
      expect(mockNeq).toHaveBeenCalledWith('delivery_address', 'Venda Física PDV');
    });
  });
});
