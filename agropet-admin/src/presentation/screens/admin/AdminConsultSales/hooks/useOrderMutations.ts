import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../../../../data/datasources/supabase/client';
import { CaixaTransaction } from '../useAdminConsultSales';

export function useOrderMutations(
  setLoading: (val: boolean) => void,
  fetchSales: () => Promise<void>,
  fetchCaixaData: () => Promise<void>,
  selectedOrder: any,
  setSelectedOrder: (order: any) => void,
  setShowPaymentEditModal: (val: boolean) => void
) {
  const handleCancelOrder = async (order: any) => {
    if (order.status === 'cancelled') {
      Alert.alert('Aviso', 'Este pedido já foi cancelado.');
      return;
    }

    Alert.alert(
      'Cancelar Venda',
      `Deseja realmente cancelar a venda #${order.id.slice(0, 8).toUpperCase()}? O estoque dos itens comprados será devolvido e a venda deduzida do caixa.`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              // NOTA: A reversão de estoque é tratada automaticamente pelo trigger
              // 'restore_stock_on_cancel' no banco de dados ao mudar o status para 'cancelled'.
              // Isso evita a duplicação de devolução de estoque.

              const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', order.id);
              if (orderError) throw orderError;

              if (order.delivery_address === 'Venda Física PDV') {
                const stored = await SecureStore.getItemAsync('agropet_sangrias');
                if (stored) {
                  const txList: CaixaTransaction[] = JSON.parse(stored);
                  const orderTime = new Date(order.created_at).getTime();
                  let bestIdx = -1;
                  let minDiff = Infinity;
                  for (let i = 0; i < txList.length; i++) {
                    const tx = txList[i];
                    if (tx.description === 'Venda PDV' && Math.abs(tx.amount - order.total) < 0.01) {
                      const txTime = new Date(tx.date).getTime();
                      const diff = Math.abs(txTime - orderTime);
                      if (diff < minDiff && diff < 5 * 60 * 1000) {
                        minDiff = diff;
                        bestIdx = i;
                      }
                    }
                  }
                  if (bestIdx !== -1) {
                    txList[bestIdx].description = 'Venda PDV (Cancelada)';
                    txList[bestIdx].amount = 0;
                    await SecureStore.setItemAsync('agropet_sangrias', JSON.stringify(txList));
                  }
                }
              }

              Alert.alert('Sucesso', 'Venda cancelada e estoque estornado!');
              await Promise.all([fetchSales(), fetchCaixaData()]);
            } catch (err) {
              console.error('Erro ao cancelar venda:', err);
              Alert.alert('Erro', 'Não foi possível cancelar a venda.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const confirmPaymentEdit = async (newMethod: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix') => {
    if (!selectedOrder) return;
    setShowPaymentEditModal(false);
    try {
      setLoading(true);
      const { error: dbError } = await supabase
        .from('orders')
        .update({ payment_method: newMethod })
        .eq('id', selectedOrder.id);
      if (dbError) throw dbError;

      if (selectedOrder.delivery_address === 'Venda Física PDV') {
        const stored = await SecureStore.getItemAsync('agropet_sangrias');
        if (stored) {
          const txList: CaixaTransaction[] = JSON.parse(stored);
          const orderTime = new Date(selectedOrder.created_at).getTime();
          let bestIdx = -1;
          let minDiff = Infinity;
          for (let i = 0; i < txList.length; i++) {
            const tx = txList[i];
            if (tx.description === 'Venda PDV' && Math.abs(tx.amount - selectedOrder.total) < 0.01) {
              const txTime = new Date(tx.date).getTime();
              const diff = Math.abs(txTime - orderTime);
              if (diff < minDiff && diff < 5 * 60 * 1000) {
                minDiff = diff;
                bestIdx = i;
              }
            }
          }
          if (bestIdx !== -1) {
            txList[bestIdx].paymentMethod = newMethod;
            await SecureStore.setItemAsync('agropet_sangrias', JSON.stringify(txList));
          }
        }
      }

      Alert.alert('Sucesso', 'Forma de pagamento atualizada!');
      await Promise.all([fetchSales(), fetchCaixaData()]);
    } catch (err) {
      console.error('Erro ao atualizar forma de pagamento:', err);
      Alert.alert('Erro', 'Não foi possível atualizar a forma de pagamento.');
    } finally {
      setLoading(false);
      setSelectedOrder(null);
    }
  };

  return {
    handleCancelOrder,
    confirmPaymentEdit,
  };
}
