import { useCaixaCalculations } from '../../presentation/screens/admin/AdminConsultSales/hooks/useCaixaCalculations';

describe('useCaixaCalculations', () => {
  it('should calculate totals with orders having null total (covers ?? coalescing)', () => {
    const orders = [
      { payment_method: 'cartao_credito', total: null },
      { payment_method: 'cartao_debito', total: undefined },
      { payment_method: 'pix', total: 150 },
      { payment_method: 'dinheiro', total: 50 },
    ];
    const transactions: any[] = [];

    const result = useCaixaCalculations(orders, transactions);

    expect(result.totalCreditoGeral).toBe(0);
    expect(result.totalDebitoGeral).toBe(0);
    expect(result.totalPixGeral).toBe(150);
    expect(result.totalDinheiroVendasGeral).toBe(50);
  });

  it('should include transaction sums in totals', () => {
    const orders: any[] = [];
    const transactions = [
      { description: 'Depósito', amount: 200, paymentMethod: 'dinheiro', type: 'suprimento' },
      { description: 'Saque', amount: 50, paymentMethod: 'dinheiro', type: 'sangria' },
      { description: 'Venda PDV', amount: 100, paymentMethod: 'pix', type: 'suprimento' },
    ];

    const result = useCaixaCalculations(orders, transactions);

    expect(result.totalDinheiroCaixaGeral).toBe(150);
    expect(result.totalPixGeral).toBe(0);
  });

  it('should format currency correctly', () => {
    const result = useCaixaCalculations([], []);
    expect(result.formatCurrency(1234.5)).toBe('R$ 1234,50');
    expect(result.formatCurrency(0)).toBe('R$ 0,00');
  });
});
