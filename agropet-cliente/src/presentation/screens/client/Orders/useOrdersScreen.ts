import { useEffect, useState, useContext, useCallback } from 'react';
import { Alert } from 'react-native';
import { AuthContext } from '../../../contexts/AuthContext';
import { supabase } from '../../../../data/datasources/supabase/client';
import { getShopStatus } from '../../../../utils/shopHours';

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

export function useOrdersScreen({ navigation }: any) {
  const { user } = useContext(AuthContext);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [activeCancelDropdownId, setActiveCancelDropdownId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [showDeliveryOnly, setShowDeliveryOnly] = useState(false);
  const [showHistoryOnly, setShowHistoryOnly] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [deliveryActive, setDeliveryActive] = useState(true);
  const [trackingErrors, setTrackingErrors] = useState<{[orderId: string]: string}>({});

  const showAlert = useCallback((title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  }, []);

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (!user) return;
    try {
      if (showLoading) setLoading(true);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items( product_id, quantity, unit_price, products( name ) )')
        .eq('user_id', user.id)
        .limit(30)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      
      const ordersWithImages = ordersData ? [...ordersData] : [];
      
      // Lazily fetch the first image for each order to avoid OOM
      const firstProductIds = ordersWithImages
        .map(o => o.order_items?.[0]?.product_id)
        .filter(Boolean);
        
      if (firstProductIds.length > 0) {
        const uniqueIds = Array.from(new Set(firstProductIds));
        const { data: imgData } = await supabase
          .from('products')
          .select('id, image_url')
          .in('id', uniqueIds);
          
        if (imgData) {
          const imgMap = new Map();
          imgData.forEach(p => imgMap.set(p.id, p.image_url));
          
          ordersWithImages.forEach(o => {
            const firstItem = o.order_items?.[0];
            if (firstItem?.products && imgMap.has(firstItem.product_id)) {
              firstItem.products.image_url = imgMap.get(firstItem.product_id);
            }
          });
        }
      }

      setOrders(ordersWithImages);
    } catch (error) {
      console.error(error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
        console.log('Error fetching delivery active in orders:', e);
      }
    };

    fetchDeliveryStatus();

    const channel = supabase
      .channel('store_settings_orders_tabs')
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(false);
    setRefreshing(false);
  }, [fetchOrders]);

  const toggleDropdown = useCallback(async (orderId: string) => {
    const shop = getShopStatus(new Date());
    if (!shop.isOpen) {
      if (shop.isSundayOrHoliday) {
        Alert.alert(
          'Aviso',
          'Você não pode rastrear produtos hoje pois é Domingo (ou Feriado)'
        );
      } else {
        setTrackingErrors(prev => ({
          ...prev,
          [orderId]: 'Você não pode rastrear fora do horário de funcionamento!'
        }));
        setTimeout(() => {
          setTrackingErrors(prev => {
            const next = { ...prev };
            delete next[orderId];
            return next;
          });
        }, 5000);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('delivery_active')
        .maybeSingle();

      if (data && !error && data.delivery_active === false) {
        Alert.alert(
          'Rastreamento Desativado',
          'Não é possível Rastrear o pedido no momento pois o frete encontra-se inativo'
        );
        return;
      }
    } catch (e) {
      console.log('Error checking delivery active status:', e);
    }

    if (activeDropdownId === orderId) {
      setActiveDropdownId(null);
    } else {
      setActiveDropdownId(orderId);
      setActiveCancelDropdownId(null);
    }
  }, [activeDropdownId]);

  const toggleCancelDropdown = useCallback((orderId: string) => {
    if (activeCancelDropdownId === orderId) {
      setActiveCancelDropdownId(null);
    } else {
      setActiveCancelDropdownId(orderId);
      setActiveDropdownId(null);
    }
  }, [activeCancelDropdownId]);

  const handleCancelOrder = useCallback(async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      showAlert('Sucesso', 'Entrega cancelada com sucesso.');
      fetchOrders();
    } catch (error: any) {
      console.error('Erro ao cancelar entrega:', error);
      showAlert('Erro', 'Não foi possível cancelar a entrega.');
    } finally {
      setShowCancelModal(false);
      setCancellingOrderId(null);
    }
  }, [showAlert, fetchOrders]);

  const activeOrders = orders.filter(op => op.status === 'confirmed');
  const pastOrders = orders.filter(op => op.status === 'completed');

  const deliveryItems: any[] = [];
  activeOrders.forEach(order => {
    if (order.order_items) {
      order.order_items.forEach((item: any) => {
        deliveryItems.push({
          orderId: order.id,
          productId: item.product_id,
          name: item.products?.name || 'Produto',
          imageUrl: getFirstImageUrl(item.products?.image_url),
        });
      });
    }
  });

  return {
    user,
    searchText, setSearchText,
    loading,
    refreshing,
    orders,
    activeDropdownId, setActiveDropdownId,
    activeCancelDropdownId, setActiveCancelDropdownId,
    showCancelModal, setShowCancelModal,
    cancellingOrderId, setCancellingOrderId,
    showDeliveryOnly, setShowDeliveryOnly,
    showHistoryOnly, setShowHistoryOnly,
    alertVisible, setAlertVisible,
    alertTitle,
    alertMessage,
    deliveryActive,
    trackingErrors,
    showAlert,
    fetchOrders,
    onRefresh,
    toggleDropdown,
    toggleCancelDropdown,
    handleCancelOrder,
    activeOrders,
    pastOrders,
    deliveryItems,
    getFirstImageUrl,
  };
}
