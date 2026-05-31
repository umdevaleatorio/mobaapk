import { useContext, useState, useCallback, useEffect } from 'react';
import {
  Alert,
  BackHandler,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CartContext } from '../../../contexts/CartContext';
import { useUserMenu } from '../../../contexts/UserMenuContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../../data/datasources/supabase/client';
import * as SecureStore from 'expo-secure-store';
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

export function useCartScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const { toggleMenu } = useUserMenu();
  const { cart, addToCart, removeFromCart, clearCart, total } = useContext(CartContext);
  const [searchText, setSearchText] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [decreases, setDecreases] = useState<Record<string, number>>({});
  const [removedAlert, setRemovedAlert] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isEditMode) {
          setIsEditMode(false);
          setSelectedItems(new Set());
          setDecreases({});
          return true;
        }
        return false;
      };

      if (BackHandler && BackHandler.addEventListener) {
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => {
          if (subscription && subscription.remove) {
            subscription.remove();
          } else if ((BackHandler as any).removeEventListener) {
            (BackHandler as any).removeEventListener('hardwareBackPress', onBackPress);
          }
        };
      }
    }, [isEditMode])
  );

  useEffect(() => {
    if (cart.length === 0) return;
    
    const validateCartItems = async () => {
      try {
        const productIds = cart.map(item => item.id);
        const { data, error } = await supabase
          .from('products')
          .select('id, name, active, stock, updated_at')
          .in('id', productIds);
          
        if (error) return;
        
        const activeProducts = data || [];
        const removedNames: string[] = [];
        
        for (const item of cart) {
          const dbProd = activeProducts.find(p => p.id === item.id);
          if (!dbProd || !dbProd.active || dbProd.stock <= 0) {
            await removeFromCart(item.id);
            
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const updatedAtDate = dbProd?.updated_at ? new Date(dbProd.updated_at) : new Date(0);
            const isRecent = updatedAtDate >= oneDayAgo;
            
            if (isRecent) {
              removedNames.push(item.name);
            }
          } else if (dbProd.stock < item.quantity) {
            const diff = item.quantity - dbProd.stock;
            await addToCart(item, -diff);
            Alert.alert(
              'Ajuste de Estoque',
              `A quantidade de "${item.name}" foi reduzida para ${dbProd.stock} pois o estoque disponível diminuiu.`
            );
          }
        }
        
        if (removedNames.length > 0) {
          try {
            const seenRaw = await SecureStore.getItemAsync('seen_removed_carrinho');
            const seenList: string[] = seenRaw ? JSON.parse(seenRaw) : [];
            
            const unseenNames = removedNames.filter(name => !seenList.includes(name));
            
            if (unseenNames.length > 0) {
              setRemovedAlert(unseenNames.join(', '));
              
              const updatedSeenList = [...seenList, ...unseenNames];
              await SecureStore.setItemAsync('seen_removed_carrinho', JSON.stringify(updatedSeenList));
            }
          } catch (storageErr) {
            console.log('Erro ao ler/salvar no SecureStore:', storageErr);
            setRemovedAlert(removedNames.join(', '));
          }
        }
      } catch (err) {
        console.log('Erro ao validar itens do carrinho:', err);
      }
    };
    
    validateCartItems();
  }, [cart.length]);

  const groupedCart = cart.reduce((acc: any[], item: any) => {
    const existing = acc.find((p: any) => p.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedItems(new Set(groupedCart.map((item: any) => item.id)));
  };

  const handleDecrease = (id: string, maxQty: number) => {
    setDecreases(prev => {
      const currentDec = prev[id] || 0;
      if (currentDec < maxQty - 1) {
        return { ...prev, [id]: currentDec + 1 };
      }
      return prev;
    });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedItems(new Set());
    setDecreases({});
  };

  const handleRemoverPress = async () => {
    if (!isEditMode) {
      if (cart.length === 0) return;
      setIsEditMode(true);
      setSelectedItems(new Set());
      setDecreases({});
      return;
    }

    const checkedCount = selectedItems.size;
    const decreasedCount = Object.keys(decreases).filter(id => decreases[id] > 0).length;

    if (checkedCount === 0 && decreasedCount === 0) {
      setIsEditMode(false);
      return;
    }

    const findItemName = (id: string) => {
      const item = cart.find(i => i.id === id);
      return item ? item.name : 'Produto';
    };

    let message = '';

    if (checkedCount === groupedCart.length && decreasedCount === 0) {
      message = 'Tem certeza que deseja apagar todos os itens do carrinho?';
    } else if (checkedCount === 0 && decreasedCount === 1) {
      const id = Object.keys(decreases).find(k => decreases[k] > 0) || '';
      message = `Tem certeza que deseja diminuir a quantidade de ${findItemName(id)}?`;
    } else if (checkedCount === 1 && decreasedCount === 0) {
      const id = Array.from(selectedItems)[0];
      message = `Tem certeza que deseja excluir ${findItemName(id)} do carrinho?`;
    } else if (checkedCount === 1 && decreasedCount === 1) {
      const decId = Object.keys(decreases).find(k => decreases[k] > 0) || '';
      const checkId = Array.from(selectedItems)[0];
      message = `Tem certeza que deseja diminuir a quantidade do item ${findItemName(decId)} e excluir o item ${findItemName(checkId)} do carrinho?`;
    } else {
      message = `Tem certeza que deseja diminuir a quantidade de ${decreasedCount} item(ns) e excluir ${checkedCount} item(ns) do carrinho?`;
    }

    Alert.alert('Confirmação', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim',
        style: 'destructive',
        onPress: async () => {
          try {
            for (const id of Array.from(selectedItems)) {
              await removeFromCart(id);
            }

            for (const [id, qty] of Object.entries(decreases)) {
              if (selectedItems.has(id)) continue;
              if (qty > 0) {
                const item = cart.find(i => i.id === id);
                if (item) {
                  await addToCart(item, -qty);
                }
              }
            }
          } catch (error) {
            console.error('Erro ao atualizar carrinho:', error);
          } finally {
            setIsEditMode(false);
            setSelectedItems(new Set());
            setDecreases({});
          }
        }
      }
    ]);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione produtos antes de prosseguir.');
      return;
    }

    const shop = getShopStatus(new Date());
    if (!shop.isOpen) {
      if (shop.isSundayOrHoliday) {
        setCheckoutError('Você não pode fazer compras hoje pois é Domingo (ou Feriado)!');
      } else {
        setCheckoutError('Você não pode fazer compras fora do horário de funcionamento!');
      }
      setTimeout(() => setCheckoutError(null), 5000);
      return;
    }

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        Alert.alert('Erro', 'Você precisa estar autenticado para fechar o pedido.');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('rua, bairro, cep, numero, location_confirmed')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        Alert.alert('Erro', 'Não foi possível carregar os dados do seu perfil. Verifique sua conexão.');
        return;
      }

      const hasEmptyFields = !profile.rua?.trim() || !profile.bairro?.trim() || !profile.cep?.trim() || !profile.numero?.trim();
      
      if (hasEmptyFields || !profile.location_confirmed) {
        Alert.alert(
          'Endereço pendente',
          'Você não cadastrou ou não confirmou o endereço da sua casa no perfil, portanto não será possível a entrega.\n\nPor favor, vá até a tela de perfil para preencher e salvar o seu endereço.',
          [
            { 
              text: 'Ir para o Perfil', 
              onPress: () => {
                navigation.navigate('ProfileScreen');
              } 
            },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
        return;
      }

      const { data: settings, error: settingsError } = await supabase
        .from('store_settings')
        .select('delivery_active')
        .maybeSingle();

      if (settings && !settingsError && settings.delivery_active === false) {
        Alert.alert(
          'Aviso',
          'Não é possível prosseguir com a compra. O frete encontra-se inativo no momento.'
        );
        return;
      }
    } catch (e) {
      console.log('Error checking profile or settings during checkout:', e);
    }
    
    navigation.navigate('PaymentScreen');
  };

  return {
    colors,
    isDarkMode,
    navigation,
    searchText,
    setSearchText,
    checkoutError,
    isEditMode,
    selectedItems,
    decreases,
    removedAlert,
    setRemovedAlert,
    groupedCart,
    handleToggleSelect,
    handleSelectAll,
    handleDecrease,
    handleCancelEdit,
    handleRemoverPress,
    handleCheckout,
    getFirstImageUrl,
  };
}
