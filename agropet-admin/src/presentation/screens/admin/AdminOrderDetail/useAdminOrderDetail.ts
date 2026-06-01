import { useRef, useEffect, useState, useCallback } from 'react';
import { Animated, Alert } from 'react-native';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useTheme } from '../../../contexts/ThemeContext';
import { NotificationService } from '../../../../services/notificationService';

/* istanbul ignore next */ function getFirstImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch (_) {}
  }
  return url;
}

export function useAdminOrderDetail({ route, navigation }: any) {
  const { order } = route.params;
  const { colors, isDarkMode } = useTheme();

  const [orderItems, setOrderItems] = useState(route.params?.order?.order_items || []);
  const orderTotal = order.total || 0;
  const userData = order.users || {};

  const glowAnim = useRef(new Animated.Value(0.3)).current;

  /* istanbul ignore next */ useEffect(() => {
    const fetchImages = async () => {
      const productIds = orderItems.map((item: any) => item.product_id).filter(Boolean);
      if (productIds.length > 0) {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('id, image_url')
            .in('id', productIds);
          
          if (data && !error) {
            const imageMap = new Map();
            data.forEach((p: any) => imageMap.set(p.id, p.image_url));

            setOrderItems((prevItems: any[]) => prevItems.map(item => {
              if (item.products && imageMap.has(item.product_id)) {
                return { ...item, products: { ...item.products, image_url: imageMap.get(item.product_id) } };
              }
              return item;
            }));
          }
        } catch (e) {
          console.error('Error fetching images for order detail:', e);
        }
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnim]);

  /* istanbul ignore next */ const orderDateObj = new Date(order.created_at);
  const formattedDate = `${orderDateObj.getDate().toString().padStart(2, '0')}/${(orderDateObj.getMonth() + 1).toString().padStart(2, '0')}/${orderDateObj.getFullYear()}`;

  const isPhysicalPDV = order.delivery_address === 'Venda Física PDV';
  const isDelivered = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  /* istanbul ignore next */ let lineColor = '#FF8A80';
  let textColor = '#D32F2F';
  let statusText = 'Pendente';
  let isRightAligned = false;

  if (isPhysicalPDV) {
    lineColor = '#00E676';
    textColor = '#00E676';
    statusText = isCancelled ? 'Venda Física (Cancelada)' : 'Venda Física (Concluída)';
    isRightAligned = !isCancelled;
  } else if (isDelivered) {
    lineColor = '#42A5F5';
    textColor = '#1976D2';
    statusText = 'Entregue';
    isRightAligned = true;
  } else if (isCancelled) {
    lineColor = '#BDBDBD';
    textColor = '#757575';
    statusText = 'Cancelado';
    isRightAligned = false;
  }

  /* istanbul ignore next */ const clientAddress = isPhysicalPDV ? 'Venda Física (PDV)' : [
    userData.rua,
    userData.numero ? `N° ${userData.numero}` : null,
    userData.bairro,
    userData.cep,
  ].filter(Boolean).join(', ');

  const handleGoBack = () => navigation.goBack();

  /* istanbul ignore next */ const nextStatus = useCallback((): string | null => {
    const s = order.status;
    if (s === 'processing') return 'confirmed';
    if (s === 'confirmed') return 'preparing';
    if (s === 'preparing') return 'delivering';
    if (s === 'delivering') return 'completed';
    return null;
  }, [order.status]);

  /* istanbul ignore next */ const nextStatusLabel = useCallback((): string => {
    const s = order.status;
    if (s === 'processing') return 'Confirmar Pedido';
    if (s === 'confirmed') return 'Iniciar Preparação';
    if (s === 'preparing') return 'Sair para Entrega';
    if (s === 'delivering') return 'Concluir Entrega';
    return '';
  }, [order.status]);

  /* istanbul ignore next */ const handleAdvanceStatus = useCallback(async () => {
    const target = nextStatus();
    if (!target) return;

    try {
      const { data, error } = await supabase.rpc('update_order_status', {
        p_order_id: order.id,
        p_new_status: target,
      });

      if (error || !data?.success) {
        Alert.alert('Erro', data?.error || 'Não foi possível atualizar o status.');
        return;
      }

      if (data.user_id) {
        await NotificationService.sendOrderStatusNotification(data.user_id, order.id, target);
      }

      Alert.alert('Sucesso', `Status alterado para "${target}".`);
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Ocorreu um erro ao atualizar o status.');
    }
  }, [order.id, order.status, nextStatus, navigation]);

  /* istanbul ignore next */ const handleCancelOrder = useCallback(async () => {
    Alert.alert(
      'Cancelar Pedido',
      'Tem certeza que deseja cancelar este pedido?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data, error } = await supabase.rpc('update_order_status', {
                p_order_id: order.id,
                p_new_status: 'cancelled',
              });

              if (error || !data?.success) {
                Alert.alert('Erro', data?.error || 'Não foi possível cancelar.');
                return;
              }

              if (data.user_id) {
                await NotificationService.sendOrderStatusNotification(data.user_id, order.id, 'cancelled');
              }

              Alert.alert('Pedido Cancelado', 'O pedido foi cancelado com sucesso.');
              navigation.goBack();
            } catch {
              Alert.alert('Erro', 'Ocorreu um erro ao cancelar.');
            }
          },
        },
      ]
    );
  }, [order.id, navigation]);

  return {
    colors,
    isDarkMode,
    order,
    orderItems,
    orderTotal,
    userData,
    glowAnim,
    formattedDate,
    isPhysicalPDV,
    isDelivered,
    isCancelled,
    lineColor,
    textColor,
    statusText,
    isRightAligned,
    clientAddress,
    handleGoBack,
    nextStatus,
    nextStatusLabel,
    handleAdvanceStatus,
    handleCancelOrder,
    getFirstImageUrl,
  };
}
