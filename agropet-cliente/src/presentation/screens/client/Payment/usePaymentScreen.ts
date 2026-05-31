import { useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../../data/datasources/supabase/client';
import { CartContext } from '../../../contexts/CartContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useUserMenu } from '../../../contexts/UserMenuContext';

export function usePaymentScreen() {
  const { toggleMenu } = useUserMenu();
  const { isDarkMode } = useTheme();
  const { cart, total, clearCart, removeFromCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const [searchText, setSearchText] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deliveryActive, setDeliveryActive] = useState(true);

  useEffect(() => {
    const fetchDeliveryStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('delivery_active')
          .maybeSingle();
        if (data && !error && data.delivery_active !== undefined) {
          setDeliveryActive(data.delivery_active);
        }
      } catch (e) {
        console.log('Error fetching delivery active in payment:', e);
      }
    };

    fetchDeliveryStatus();

    const channel = supabase
      .channel('store_settings_payment_tabs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings' },
        (payload) => {
          if (payload.new && (payload.new as any).delivery_active !== undefined) {
            setDeliveryActive((payload.new as any).delivery_active);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const grandTotal = total;

  const handleCreateOrder = async (navigation: any) => {
    if (cart.length === 0) {
      Alert.alert('Erro', 'Seu carrinho está vazio.');
      navigation.goBack();
      return;
    }

    const dbPaymentMethod = {
      'PIX': 'pix',
      'Dinheiro': 'dinheiro',
      'Cartão/Crédito': 'cartao_credito',
      'Cartão/Débito': 'cartao_debito'
    }[paymentMethod] || 'pix';

    const items = cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price
    }));

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('finalizar_pedido', {
        p_user_id: user?.id,
        p_items: items,
        p_payment_method: dbPaymentMethod,
        p_delivery_type: 'retirada',
        p_delivery_address: '',
        p_needs_change: ''
      });

      if (error) {
        if (error.message && error.message.includes('ESTOQUE_INSUFICIENTE')) {
          try {
            const jsonStr = error.message.split('ESTOQUE_INSUFICIENTE:').pop() || '[]';
            const detalhes = JSON.parse(jsonStr);
            const msgs = detalhes.map((d: any) =>
              d.available === 0
                ? `• ${d.name}: esgotado`
                : `• ${d.name}: pedido ${d.requested}, disponível ${d.available}`
            );
            for (const d of detalhes) {
              if (d.available === 0) {
                await removeFromCart(d.product_id);
              }
            }
            Alert.alert(
              'Estoque Insuficiente',
              `Alguns produtos não têm estoque suficiente:\n\n${msgs.join('\n')}\n\nOs produtos esgotados foram removidos do carrinho. Ajuste as quantidades e tente novamente.`
            );
          } catch (parseErr) {
            Alert.alert('Estoque Insuficiente', 'Alguns produtos do carrinho não têm estoque suficiente. Verifique e tente novamente.');
          }
          return;
        }

        if (error.message && error.message.includes('PRODUTO_NAO_ENCONTRADO')) {
          Alert.alert('Produto Indisponível', 'Um produto do seu carrinho não está mais disponível. Verifique o carrinho e tente novamente.');
          return;
        }

        throw error;
      }

      const orderId = data.order_id;
      await clearCart();
      navigation.replace('PaymentConfirmScreen', { orderId });
    } catch (err: any) {
      Alert.alert('Erro ao Fazer Pedido', err.message || 'Ocorreu um erro inesperado. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return {
    toggleMenu, isDarkMode, cart, grandTotal, searchText, setSearchText,
    paymentMethod, setPaymentMethod, isDropdownOpen, setIsDropdownOpen,
    loading, deliveryActive, handleCreateOrder,
  };
}
