import React, { useState, useEffect } from 'react';
import { Animated, Alert, BackHandler } from 'react-native';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export function useAdminDashboardPdv(onSaleComplete?: () => void) {
  const navigation = useNavigation<any>();
  const [isPDVMode, setIsPDVMode] = useState(false);
  const [pdvSelectMode, setPdvSelectMode] = useState(false);
  const [pdvProducts, setPdvProducts] = useState<any[]>([]);
  const [pdvSearchText, setPdvSearchText] = useState('');
  const [pdvActiveCategories, setPdvActiveCategories] = useState<string[]>([]);
  const [pdvCart, setPdvCart] = useState<Record<string, { qty: number; checked: boolean }>>({});
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [dropdownExpanded, setDropdownExpanded] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix'>('dinheiro');
  const [pdvLoading, setPdvLoading] = useState(false);
  const [dismissedProductIds, setDismissedProductIds] = useState<Set<string>>(new Set());
  const [cancelOpacity] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(0));

  const dismissAlert = (id: string) => {
    setDismissedProductIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (pdvSelectMode) {
      cancelOpacity.setValue(0);
      Animated.timing(cancelOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [pdvSelectMode]);

  const fetchPdvProducts = async () => {
    setPdvLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, stock, active, category_id, description, categories(name)')
      .eq('active', true)
      .order('name', { ascending: true });
    if (!error && data) {
      setPdvProducts(data);
    }
    setPdvLoading(false);
  };

  React.useLayoutEffect(() => {
    const display = isPDVMode ? 'none' : 'flex';
    navigation.setOptions({ tabBarStyle: { display } });
    navigation.getParent()?.setOptions({ tabBarStyle: { display } });
  }, [isPDVMode, navigation]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isPDVMode) {
          setIsPDVMode(false);
          setPdvSelectMode(false);
          setPdvCart({});
          return true;
        }
        return false;
      };
      /* istanbul ignore next */
      if (BackHandler && BackHandler.addEventListener) {
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => {
          /* istanbul ignore next */
          if (subscription && subscription.remove) {
            subscription.remove();
          /* istanbul ignore next */
          } else if ((BackHandler as any).removeEventListener) {
            (BackHandler as any).removeEventListener('hardwareBackPress', onBackPress);
          }
        };
      }
    }, [isPDVMode])
  );

  useEffect(() => {
    if (isPDVMode && pdvProducts.length === 0) {
      fetchPdvProducts();
    }
  }, [isPDVMode]);

  const togglePdvCart = (item: any) => {
    setPdvCart(prev => {
      const newCart = { ...prev };
      if (!newCart[item.id]) {
        newCart[item.id] = { qty: 1, checked: true };
      } else {
        newCart[item.id].checked = !newCart[item.id].checked;
      }
      return newCart;
    });
  };

  const updatePdvCartQty = (id: string, delta: number) => {
    setPdvCart(prev => {
      const newCart = { ...prev };
      if (!newCart[id]) {
        newCart[id] = { qty: Math.max(1, delta), checked: true };
      } else {
        newCart[id].qty = Math.max(1, newCart[id].qty + delta);
      }
      return newCart;
    });
  };

  const handleConfirmPdvSale = async () => {
    const selectedItems = pdvProducts.filter(p => pdvCart[p.id]?.checked);
    if (selectedItems.length === 0) return;
    for (const item of selectedItems) {
      if (item.stock < pdvCart[item.id].qty) {
        Alert.alert('Erro', `Estoque insuficiente para ${item.name}. (Disponível: ${item.stock})`);
        return;
      }
    }
    setPdvLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      let totalVenda = 0;
      for (const item of selectedItems) {
        totalVenda += pdvCart[item.id].qty * item.price;
      }
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          status: 'completed',
          payment_method: checkoutPaymentMethod,
          delivery_type: 'retirada',
          delivery_address: 'Venda Física PDV',
          total: totalVenda
        })
        .select()
        .single();
      if (orderError) throw orderError;
      const orderId = orderData.id;
      for (const item of selectedItems) {
        const qty = pdvCart[item.id].qty;
        await supabase.from('order_items').insert({
          order_id: orderId,
          product_id: item.id,
          quantity: qty,
          unit_price: item.price
        });
        await supabase.from('products')
          .update({ stock: item.stock - qty })
          .eq('id', item.id);
      }
      Alert.alert('Sucesso', 'Venda registrada com sucesso!');
      setIsPDVMode(false);
      setPdvSelectMode(false);
      setPdvCart({});
      setShowCheckoutModal(false);
      if (onSaleComplete) onSaleComplete();
    } catch (err: any) {
      Alert.alert('Erro', 'Ocorreu um erro ao registrar a venda.');
      console.log(err);
    }
    setPdvLoading(false);
  };

  return {
    isPDVMode, pdvSelectMode, pdvProducts, pdvSearchText, pdvActiveCategories,
    pdvCart, showCheckoutModal, dropdownExpanded, checkoutPaymentMethod,
    pdvLoading, dismissedProductIds, cancelOpacity, pulseAnim,
    setIsPDVMode, setPdvSelectMode, setPdvProducts,
    setPdvSearchText, setPdvActiveCategories, setPdvCart,
    setShowCheckoutModal, setDropdownExpanded, setCheckoutPaymentMethod,
    setPdvLoading, setDismissedProductIds,
    dismissAlert,
    togglePdvCart, updatePdvCartQty,
    handleConfirmPdvSale,
  };
}
