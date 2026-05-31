import type { CaixaTransaction } from './useAdminDashboard';

export function useAdminDashboardStats(
  orders: any[],
  allOrders: any[],
  transactions: CaixaTransaction[],
  cashFlowFilter: string,
  cashFlowStartDate: Date | null,
  cashFlowEndDate: Date | null,
) {
  const activeTransactions = transactions.filter((t) => {
    if (cashFlowStartDate && cashFlowEndDate) {
      const start = new Date(cashFlowStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(cashFlowEndDate);
      end.setHours(23, 59, 59, 999);
      const tDate = new Date(t.date);
      if (tDate.getTime() < start.getTime() || tDate.getTime() > end.getTime()) {
        return false;
      }
    }
    if (cashFlowFilter !== 'all') {
      if ((t.type || 'sangria') !== cashFlowFilter) {
        return false;
      }
    }
    return true;
  });

  const getTransactionSum = (method: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix', type: 'sangria' | 'suprimento') => {
    return transactions.reduce((acc, t) => {
      if (t.description === 'Venda PDV') return acc;
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

  const volumeVendas = orders.length;
  const ticketMedio = volumeVendas > 0 ? (orders.reduce((acc, o) => acc + (o.total ?? 0), 0) / volumeVendas) : 0;

  const getTopPaymentMethod = () => {
    if (volumeVendas === 0) return 'Nenhum';
    const counts = { credito: 0, debito: 0, pix: 0, dinheiro: 0 };
    orders.forEach(o => {
      if (o.payment_method === 'cartao_credito') counts.credito++;
      else if (o.payment_method === 'cartao_debito') counts.debito++;
      else if (o.payment_method === 'pix') counts.pix++;
      else if (o.payment_method === 'dinheiro') counts.dinheiro++;
    });
    const maxVal = Math.max(counts.credito, counts.debito, counts.pix, counts.dinheiro);
    if (maxVal === 0) return 'Nenhum';
    if (maxVal === counts.pix) return 'Pix 📱';
    if (maxVal === counts.dinheiro) return 'Dinheiro 💵';
    if (maxVal === counts.credito) return 'Crédito 💳';
    return 'Débito 💳';
  };

  const topMethod = getTopPaymentMethod();

  const formatCurrency = (val: number) => {
    return `R$ ${val.toFixed(2).replace('.', ',')}`;
  };

  return {
    activeTransactions,
    totalCreditoGeral,
    totalDebitoGeral,
    totalPixGeral,
    totalDinheiroVendasGeral,
    totalDinheiroCaixaGeral,
    saldoTotalCaixaGeral,
    volumeVendas,
    ticketMedio,
    topMethod,
    formatCurrency,
  };
}
