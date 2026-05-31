import { useState, useEffect, useContext, useRef } from 'react';
import { Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../../../data/datasources/supabase/client';
import { CartContext } from '../../../contexts/CartContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { useFilter, isProductInCategories } from '../../../contexts/FilterContext';
import { getShopStatus } from '../../../../utils/shopHours';

export default function useHomeScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { searchText, setSearchText, selectedCategories } = useFilter();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const [esgotadoAlert, setEsgotadoAlert] = useState<string | null>(null);
  const [deliveryActive, setDeliveryActive] = useState<boolean>(true);
  const [showReactivatedAlert, setShowReactivatedAlert] = useState(false);
  const [clientName, setClientName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [shopStatus, setShopStatusState] = useState<any>(null);
  const [showGreetingBar, setShowGreetingBar] = useState(true);

  const greetingOpacity = useRef(new Animated.Value(1)).current;
  const greetingScale = useRef(new Animated.Value(1)).current;
  const closeButtonRotate = useRef(new Animated.Value(0)).current;
  const closeButtonScale = useRef(new Animated.Value(1)).current;

  const fetchProfileName = async () => {
    if (user?.id) {
      try {
        const { data } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();
        if (data?.name) {
          const firstName = data.name.trim().split(' ')[0];
          setClientName(firstName);
        } else {
          setClientName('');
        }
      } catch (e) {
        console.log('Erro ao buscar nome do cliente para a saudação:', e);
      }
    } else {
      setClientName('');
    }
  };

  const checkGreetingPreference = async () => {
    try {
      const val = await SecureStore.getItemAsync('show_greeting_bar');
      if (val === 'false') {
        setShowGreetingBar(false);
      } else {
        greetingOpacity.setValue(0);
        greetingScale.setValue(0.95);
        closeButtonRotate.setValue(0);
        closeButtonScale.setValue(1);
        setShowGreetingBar(true);

        Animated.parallel([
          Animated.timing(greetingOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(greetingScale, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (e) {
      console.log('Erro ao ler preferência de saudação:', e);
    }
  };

  const handleDismissGreeting = () => {
    Animated.parallel([
      Animated.timing(closeButtonRotate, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(closeButtonScale, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(greetingOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(greetingScale, {
        toValue: 0.95,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      setShowGreetingBar(false);
      try {
        await SecureStore.setItemAsync('show_greeting_bar', 'false');
      } catch (e) {
        console.log('Erro ao salvar preferência de saudação:', e);
      }
    });
  };

  useEffect(() => {
    fetchProfileName();
    checkGreetingPreference();
  }, [user]);

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      const status = getShopStatus(now);
      setShopStatusState(status);

      const hour = now.getHours();
      const isDay = hour >= 6 && hour < 18;
      const nameToUse = clientName || 'Cliente';
      if (isDay) {
        setGreeting(`Bom dia, ${nameToUse}!`);
      } else {
        setGreeting(`Boa noite, ${nameToUse}!`);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [clientName]);

  const fetchProducts = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, stock, active, category_id, created_at, image_url')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (!error) setProducts(data || []);
    if (showLoadingIndicator) setLoading(false);
  };

  const handleRefresh = async () => {
    setShowReactivatedAlert(false);
    setRefreshing(true);
    await Promise.all([
      fetchProducts(false),
      checkRecentEsgotados(),
      checkDeliveryStatus()
    ]);
    setRefreshing(false);
  };

  const checkRecentEsgotados = async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('products')
        .select('id, name, updated_at')
        .eq('active', false)
        .gte('updated_at', oneDayAgo);

      if (error || !data || data.length === 0) return;

      const seenRaw = await SecureStore.getItemAsync('seen_esgotados');
      const seenList: string[] = seenRaw ? JSON.parse(seenRaw) : [];

      const unseen = data.find(p => !seenList.includes(p.id));
      if (unseen) {
        setEsgotadoAlert(unseen.name);
        seenList.push(unseen.id);
        await SecureStore.setItemAsync('seen_esgotados', JSON.stringify(seenList));
      }
    } catch (e) {
      console.log('Erro ao verificar esgotados:', e);
    }
  };

  const checkDeliveryStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('delivery_active')
        .maybeSingle();

      if (data && !error && data.delivery_active !== undefined) {
        const currentActive = data.delivery_active;
        setDeliveryActive(currentActive);

        if (typeof (global as any).refreshDeliveryTabs === 'function') {
          (global as any).refreshDeliveryTabs();
        }

        const lastKnownRaw = await SecureStore.getItemAsync('last_known_delivery_active');
        if (lastKnownRaw !== null) {
          const lastKnown = lastKnownRaw === 'true';
          if (!lastKnown && currentActive) {
            setShowReactivatedAlert(true);
            await SecureStore.setItemAsync('seen_reactivated_alert', 'true');
          }
        } else {
          await SecureStore.setItemAsync('seen_reactivated_alert', 'true');
        }

        if (!currentActive) {
          await SecureStore.setItemAsync('seen_reactivated_alert', 'false');
          setShowReactivatedAlert(false);
        }

        await SecureStore.setItemAsync('last_known_delivery_active', String(currentActive));
      }
    } catch (e) {
      console.log('Erro ao verificar status do frete na Home:', e);
    }
  };

  const handleCloseReactivated = async () => {
    setShowReactivatedAlert(false);
    await SecureStore.setItemAsync('seen_reactivated_alert', 'true');
  };

  useEffect(() => {
    fetchProducts();
    checkRecentEsgotados();
    checkDeliveryStatus();
    fetchProfileName();

    const unsubscribeBlur = navigation.addListener('blur', () => {
      setShowReactivatedAlert(false);
    });

    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchProfileName();
      checkGreetingPreference();
    });

    const channel = supabase
      .channel('store_settings_home')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings' },
        async (payload) => {
          if (payload.new && (payload.new as any).delivery_active !== undefined) {
            const currentActive = (payload.new as any).delivery_active;
            setDeliveryActive(currentActive);

            if (typeof (global as any).refreshDeliveryTabs === 'function') {
              (global as any).refreshDeliveryTabs();
            }

            const lastKnownRaw = await SecureStore.getItemAsync('last_known_delivery_active');
            if (lastKnownRaw !== null) {
              const lastKnown = lastKnownRaw === 'true';
              if (!lastKnown && currentActive) {
                setShowReactivatedAlert(true);
                await SecureStore.setItemAsync('seen_reactivated_alert', 'true');
              }
            } else {
              await SecureStore.setItemAsync('seen_reactivated_alert', 'true');
            }

            if (!currentActive) {
              await SecureStore.setItemAsync('seen_reactivated_alert', 'false');
              setShowReactivatedAlert(false);
            }

            await SecureStore.setItemAsync('last_known_delivery_active', String(currentActive));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      unsubscribeBlur();
      unsubscribeFocus();
    };
  }, [navigation]);

  const filteredProducts = products.filter(p => {
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const query = searchText.toLowerCase();
    const matchesSearch = name.includes(query) || desc.includes(query);
    const matchesCategory = isProductInCategories(p, selectedCategories);
    return matchesSearch && matchesCategory;
  });

  return {
    colors,
    isDarkMode,
    navigation,
    products,
    loading,
    refreshing,
    searchText,
    setSearchText,
    selectedCategories,
    addToCart,
    esgotadoAlert,
    setEsgotadoAlert,
    deliveryActive,
    showReactivatedAlert,
    greeting,
    shopStatus,
    showGreetingBar,
    greetingOpacity,
    greetingScale,
    closeButtonRotate,
    closeButtonScale,
    filteredProducts,
    handleRefresh,
    handleCloseReactivated,
    handleDismissGreeting,
  };
}
