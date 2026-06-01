import { useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../../data/datasources/supabase/client';
import { CartContext } from '../../../contexts/CartContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useUserMenu } from '../../../contexts/UserMenuContext';
import { useConnectivity } from '../../../contexts/ConnectivityContext';
import { checkRateLimit } from '../../../../services/rateLimitService';
import { NotificationService } from '../../../../services/notificationService';

function generateIdempotencyKey(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function usePaymentScreen() {
  const { toggleMenu } = useUserMenu();
  const { isDarkMode } = useTheme();
  const { cart, total, clearCart, removeFromCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const [searchText, setSearchText] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isOnline, syncQueueService } = useConnectivity();
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

    const rateCheck = await checkRateLimit('finalizar_pedido', 5, 60);
    if (!rateCheck.allowed) {
      Alert.alert(
        'Muitas tentativas',
        `Você excedeu o limite de pedidos. Aguarde ${rateCheck.window_seconds} segundos antes de tentar novamente.`
      );
      return;
    }

    const items = cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price
    }));

    setLoading(true);
    const idempotencyKey = generateIdempotencyKey();
    const maxRetries = 3;

    const attemptOrder = async (attempt: number): Promise<void> => {
      try {
        const { data, error } = await supabase.rpc('finalizar_pedido', {
          p_user_id: user?.id,
          p_items: items,
          p_payment_method: dbPaymentMethod,
          p_delivery_type: 'retirada',
          p_delivery_address: '',
          p_needs_change: '',
          p_idempotency_key: idempotencyKey,
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

          if (error.message && error.message.includes('RECURSO_OCUPADO')) {
            if (attempt < maxRetries) {
              const delay = Math.pow(2, attempt - 1) * 1000;
              await new Promise(resolve => setTimeout(resolve, delay));
              return attemptOrder(attempt + 1);
            }
            Alert.alert('Sistema Ocupado', 'O sistema está processando muitos pedidos no momento. Tente novamente em alguns instantes.');
            return;
          }

          throw error;
        }

        const orderId = data.order_id;
        await clearCart();
        if (user?.id) {
          NotificationService.sendOrderStatusNotification(user.id, orderId, dbPaymentMethod === 'pix' ? 'processing' : 'confirmed');
        }
        navigation.replace('PaymentConfirmScreen', { orderId, paymentMethod: dbPaymentMethod });
      } catch (err: any) {
        if (err.message && err.message.includes('RECURSO_OCUPADO') && attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptOrder(attempt + 1);
        }
        if (syncQueueService && !isOnline) {
          await syncQueueService.enqueue('INSERT', 'orders', {
            user_id: user?.id,
            items,
            payment_method: dbPaymentMethod,
            delivery_type: 'retirada',
            delivery_address: '',
            needs_change: '',
            idempotency_key: idempotencyKey,
          });
          await clearCart();
          Alert.alert('Pedido Pendente', 'Seu pedido foi salvo offline e será enviado quando houver conexão.');
          return;
        }
        Alert.alert('Erro ao Fazer Pedido', err.message || 'Ocorreu um erro inesperado. Verifique sua conexão e tente novamente.');
      }
    };

    await attemptOrder(1);
  };

  return {
    toggleMenu, isDarkMode, cart, grandTotal, searchText, setSearchText,
    paymentMethod, setPaymentMethod, isDropdownOpen, setIsDropdownOpen,
    loading, deliveryActive, handleCreateOrder,
  };
}
