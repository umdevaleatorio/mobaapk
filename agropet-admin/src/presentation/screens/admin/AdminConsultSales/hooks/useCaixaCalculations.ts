import { CaixaTransaction } from '../useAdminConsultSales';

export function useCaixaCalculations(allOrders: any[], transactions: CaixaTransaction[]) {
  const getTransactionSum = (method: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix', type: 'sangria' | 'suprimento') => {
    return transactions.reduce((acc, t) => {
      if (t.description === 'Venda PDV' || t.description === 'Venda PDV (Cancelada)') return acc;
      const isMatch = (t.paymentMethod || 'dinheiro') === method && (t.type || 'sangria') === type;
      return acc + (isMatch ? t.amount : 0);
    }, 0);
  };

  const totalCreditoGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'cartao_credito' ? (o.total ?? 0) : 0), 0) + getTransactionSum('cartao_credito', 'suprimento') - getTransactionSum('cartao_credito', 'sangria');
  const totalDebitoGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'cartao_debito' ? (o.total ?? 0) : 0), 0) + getTransactionSum('cartao_debito', 'suprimento') - getTransactionSum('cartao_debito', 'sangria');
  const totalPixGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'pix' ? (o.total ?? 0) : 0), 0) + getTransactionSum('pix', 'suprimento') - getTransactionSum('pix', 'sangria');
  const totalDinheiroVendasGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'dinheiro' ? (o.total ?? 0) : 0), 0);
  const totalDinheiroCaixaGeral = totalDinheiroVendasGeral + getTransactionSum('dinheiro', 'suprimento') - getTransactionSum('dinheiro', 'sangria');
  const saldoTotalCaixaGeral = totalCreditoGeral + totalDebitoGeral + totalPixGeral + totalDinheiroCaixaGeral;

  const formatCurrency = (val: number) => {
    return `R$ ${val.toFixed(2).replace('.', ',')}`;
  };

  return {
    totalCreditoGeral,
    totalDebitoGeral,
    totalPixGeral,
    totalDinheiroVendasGeral,
    totalDinheiroCaixaGeral,
    saldoTotalCaixaGeral,
    formatCurrency,
  };
}
