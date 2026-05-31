import { useRef, useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useTheme } from '../../../contexts/ThemeContext';

function getFirstImageUrl(url: string | null | undefined): string | null {
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

  useEffect(() => {
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

  const orderDateObj = new Date(order.created_at);
  const formattedDate = `${orderDateObj.getDate().toString().padStart(2, '0')}/${(orderDateObj.getMonth() + 1).toString().padStart(2, '0')}/${orderDateObj.getFullYear()}`;

  const isPhysicalPDV = order.delivery_address === 'Venda Física PDV';
  const isDelivered = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  let lineColor = '#FF8A80';
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

  const clientAddress = isPhysicalPDV ? 'Venda Física (PDV)' : [
    userData.rua,
    userData.numero ? `N° ${userData.numero}` : null,
    userData.bairro,
    userData.cep,
  ].filter(Boolean).join(', ');

  const handleGoBack = () => navigation.goBack();

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
    getFirstImageUrl,
  };
}
