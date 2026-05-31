import { useState } from 'react';

export function useOrderFilters(orders: any[]) {
  const [originFilter, setOriginFilter] = useState<'tudo' | 'fisica' | 'concluidos'>('tudo');
  const [selectedPayMethods, setSelectedPayMethods] = useState<string[]>(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix']);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'completed' | 'cancelled'>('todos');

  const [tempOriginFilter, setTempOriginFilter] = useState<'tudo' | 'fisica' | 'concluidos'>('tudo');
  const [tempPayMethods, setTempPayMethods] = useState<string[]>(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix']);
  const [tempStatusFilter, setTempStatusFilter] = useState<'todos' | 'completed' | 'cancelled'>('todos');

  const filteredOrders = orders.filter((order) => {
    if (originFilter === 'fisica') {
      if (order.delivery_address !== 'Venda Física PDV') return false;
    } else if (originFilter === 'concluidos') {
      if (order.delivery_address === 'Venda Física PDV') return false;
    }

    if (selectedPayMethods.length > 0) {
      if (!selectedPayMethods.includes(order.payment_method)) return false;
    } else {
      return false;
    }

    if (statusFilter !== 'todos') {
      if (order.status !== statusFilter) return false;
    }
    return true;
  });

  const handleToggleTempPayMethod = (method: string) => {
    if (tempPayMethods.includes(method)) {
      setTempPayMethods(tempPayMethods.filter(m => m !== method));
    } else {
      setTempPayMethods([...tempPayMethods, method]);
    }
  };

  const handleApplyFilters = () => {
    setOriginFilter(tempOriginFilter);
    setSelectedPayMethods(tempPayMethods);
    setStatusFilter(tempStatusFilter);
  };

  const prepareTempFilters = () => {
    setTempOriginFilter(originFilter);
    setTempPayMethods(selectedPayMethods);
    setTempStatusFilter(statusFilter);
  };

  return {
    originFilter,
    setOriginFilter,
    selectedPayMethods,
    setSelectedPayMethods,
    statusFilter,
    setStatusFilter,
    tempOriginFilter,
    setTempOriginFilter,
    tempPayMethods,
    setTempPayMethods,
    tempStatusFilter,
    setTempStatusFilter,
    filteredOrders,
    handleToggleTempPayMethod,
    handleApplyFilters,
    prepareTempFilters,
  };
}
