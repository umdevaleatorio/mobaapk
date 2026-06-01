import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, Platform, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import { useUserMenu } from '../../contexts/UserMenuContext';
import { AuthContext } from '../../contexts/AuthContext';
import { CatalogHeader } from '../../components/CatalogHeader';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../../data/datasources/supabase/client';
import { NotificationService } from '../../../services/notificationService';

// === IMPORTAÇÃO DOS SVGs (assets/tela10) ===
import CheckInIcon from '../../assets/tela10/meio/Check-In.svg';
import PedidoConfirmadoTxt from '../../assets/tela10/meio/Pedido Confirmado!.svg';
import BtnAcompanhar from '../../assets/tela10/meio/Acompanhar pedido-1.svg';

// Barra Inferior
import HomeIcon8 from '../../assets/tela8/barra/Home.svg';
import HomeIcon8Dark from '../../assets/tela8/barra/HomeDark.svg';
import MapIcon8 from '../../assets/tela8/barra/Map.svg';
import MapIcon8Dark from '../../assets/tela8/barra/MapDark.svg';
import CartIcon8 from '../../assets/tela8/barra/Cart.svg';
import CartIcon8Dark from '../../assets/tela8/barra/CartDark.svg';
import GearIcon8 from '../../assets/tela8/barra/Gear.svg';
import GearIcon8Dark from '../../assets/tela8/barra/GearDark.svg';
import MenuLabel8 from '../../assets/tela8/barra/MenuLabel.svg';
import MapaLabel8 from '../../assets/tela8/barra/MapaLabel.svg';
import CarrinhoLabel8 from '../../assets/tela8/barra/CarrinhoLabel.svg';
import OpcoesLabel8 from '../../assets/tela8/barra/OpcoesLabel.svg';

export default function PaymentConfirmScreen({ route, navigation }: any) {
  const { toggleMenu } = useUserMenu();
  const { isDarkMode } = useTheme();
  const { user } = useContext(AuthContext);
  const { orderId, paymentMethod } = route.params || {};
  const isPix = paymentMethod === 'pix';

  const [searchText, setSearchText] = useState('');
  const [deliveryActive, setDeliveryActive] = useState(true);

  // PIX state
  const [pixKey, setPixKey] = useState('');
  const [pixMerchant, setPixMerchant] = useState('');
  const [pixStatus, setPixStatus] = useState<'pending' | 'paid' | 'checking'>('pending');
  const [loadingPix, setLoadingPix] = useState(isPix);
  const [copied, setCopied] = useState(false);
  const [errorPix, setErrorPix] = useState('');

  // Buscar chave PIX e iniciar polling
  useEffect(() => {
    if (!isPix) return;

    const fetchPixKey = async () => {
      try {
        setLoadingPix(true);
        const { data, error } = await supabase.rpc('get_pix_key');
        if (!error && data) {
          setPixKey(data.chave_pix || '');
          setPixMerchant(data.pix_merchant_name || '');
          if (!data.chave_pix) {
            setErrorPix('Chave PIX não configurada pela loja.');
          }
        }
      } catch (e) {
        setErrorPix('Erro ao carregar dados PIX.');
      } finally {
        setLoadingPix(false);
      }
    };

    fetchPixKey();
  }, [isPix]);

  // Polling de status PIX a cada 10s
  useEffect(() => {
    if (!isPix || !orderId) return;

    const checkStatus = async () => {
      if (pixStatus === 'paid') return;
      try {
        const { data, error } = await supabase.rpc('check_pix_status', { p_order_id: orderId });
        if (!error && data?.transaction_status === 'paid') {
          setPixStatus('paid');
        }
      } catch (e) {}
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [isPix, orderId, pixStatus]);

  // Confirmar pagamento PIX
  const handleConfirmPayment = useCallback(async () => {
    if (!orderId) return;
    setPixStatus('checking');
    try {
      const { data, error } = await supabase.rpc('confirm_pix_payment', { p_order_id: orderId });
      if (!error && data?.success) {
        setPixStatus('paid');
        if (user?.id) {
          NotificationService.sendOrderStatusNotification(user.id, orderId, 'confirmed');
        }
      } else {
        setErrorPix(data?.error || 'Erro ao confirmar pagamento.');
        setPixStatus('pending');
      }
    } catch (e) {
      setErrorPix('Erro de conexão ao confirmar.');
      setPixStatus('pending');
    }
  }, [orderId]);

  // Copiar chave PIX
  const handleCopyPixKey = useCallback(async () => {
    if (!pixKey) return;
    await Clipboard.setStringAsync(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }, [pixKey]);

  // Sincronizar status de frete
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
      } catch (e) {}
    };

    fetchDeliveryStatus();

    const channel = supabase
      .channel('store_settings_confirm_tabs')
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

  return (
    <View style={[styles.mainContainer, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <StatusBar backgroundColor={isDarkMode ? '#121212' : '#1C2434'} barStyle="light-content" />

      {/* Header Unificado */}
      <CatalogHeader 
        title="Checkout"
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      {/* ========== CONTEÚDO (MEIO) ========== */}
      <View style={styles.contentContainer}>
        {isPix && pixStatus === 'paid' ? (
          <>
            <CheckInIcon width={120} height={120} style={styles.checkIcon} />
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDarkMode ? '#81C784' : '#2A7420', textAlign: 'center', marginBottom: 16 }}>
              Pagamento confirmado!
            </Text>
            <Text style={{ fontSize: 14, color: isDarkMode ? '#A8A8B3' : '#767676', textAlign: 'center', marginBottom: 32 }}>
              Seu pagamento PIX foi recebido com sucesso.
            </Text>
          </>
        ) : isPix && loadingPix ? (
          <ActivityIndicator size="large" color="#339914" />
        ) : isPix ? (
          <>
            <Feather name="clock" size={60} color="#00BFA5" style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1C2434', textAlign: 'center', marginBottom: 8 }}>
              Aguardando pagamento
            </Text>
            <Text style={{ fontSize: 14, color: isDarkMode ? '#A8A8B3' : '#767676', textAlign: 'center', marginBottom: 4 }}>
              Pedido #{orderId?.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={{ fontSize: 13, color: isDarkMode ? '#A8A8B3' : '#767676', textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 }}>
              Use a chave PIX abaixo para realizar o pagamento. O pedido será confirmado automaticamente após a compensação.
            </Text>

            {pixKey ? (
              <View style={{ width: '85%', backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: isDarkMode ? '#A8A8B3' : '#767676', marginBottom: 4 }}>Chave PIX</Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1C2434', marginBottom: 12, textAlign: 'center' }} selectable>{pixKey}</Text>
                {pixMerchant ? (
                  <Text style={{ fontSize: 12, color: isDarkMode ? '#A8A8B3' : '#767676', textAlign: 'center', marginBottom: 12 }}>
                    {pixMerchant}
                  </Text>
                ) : null}
                <TouchableOpacity
                  style={{ backgroundColor: copied ? '#25BE36' : '#00BFA5', borderRadius: 8, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                  onPress={handleCopyPixKey}
                  activeOpacity={0.7}
                >
                  <Feather name={copied ? 'check' : 'copy'} size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>{copied ? 'Copiado!' : 'Copiar chave PIX'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {errorPix ? (
              <Text style={{ fontSize: 12, color: '#FF3B30', textAlign: 'center', marginBottom: 8, paddingHorizontal: 20 }}>{errorPix}</Text>
            ) : null}

            {pixStatus === 'checking' ? (
              <ActivityIndicator size="small" color="#339914" style={{ marginVertical: 12 }} />
            ) : (
              <TouchableOpacity
                style={{ backgroundColor: isDarkMode ? '#1E1E24' : '#1C2434', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12, borderWidth: isDarkMode ? 1 : 0, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }}
                onPress={handleConfirmPayment}
                activeOpacity={0.7}
              >
                <Text style={{ color: isDarkMode ? '#FFE082' : '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Já paguei</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => navigation.navigate('OrdersScreen')}>
              <Text style={{ color: isDarkMode ? '#A8A8B3' : '#767676', fontSize: 13, textDecorationLine: 'underline' }}>Ver meus pedidos</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <CheckInIcon width={181} height={181} style={styles.checkIcon} />
            {isDarkMode ? (
              <View style={[styles.successTitle, { width: 194, height: 80, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>
                  Pedido confirmado!
                </Text>
              </View>
            ) : (
              <PedidoConfirmadoTxt width={194} height={80} style={styles.successTitle} />
            )}
            
            <TouchableOpacity
              style={[styles.btnAcompanhar, { backgroundColor: isDarkMode ? '#1E1E24' : '#1C2434', borderWidth: isDarkMode ? 1 : 0, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('OrdersScreen')}
            >
              <BtnAcompanhar width={154} height={45} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ========== BARRA INFERIOR (Matches ClientTabs) ========== */}
      <View style={styles.tabBarOuter}>
        <View style={[styles.tabBarInner, { backgroundColor: isDarkMode ? '#000000' : '#E3E4EB' }]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Menu' })}>
            <View style={isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBg}>
              {isDarkMode ? <HomeIcon8Dark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <HomeIcon8 width={32} height={32} />}
            </View>
            {isDarkMode ? <MenuLabel8 width={33} height={9} fill="#FFFFFF" stroke="#FFFFFF" /> : <MenuLabel8 width={33} height={9} />}
          </TouchableOpacity>
          
          <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          {deliveryActive && (
            <>
              <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Mapa' })}>
                <View style={isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBg}>
                  {isDarkMode ? <MapIcon8Dark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <MapIcon8 width={32} height={32} />}
                </View>
                {isDarkMode ? <MapaLabel8 width={32} height={12} fill="#FFFFFF" stroke="#FFFFFF" /> : <MapaLabel8 width={32} height={12} />}
              </TouchableOpacity>
              
              <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />
            </>
          )}

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Carrinho' })}>
            <View style={isDarkMode ? { backgroundColor: '#FFFFFF', width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : [styles.iconBg, { backgroundColor: '#E3DAD9', borderWidth: 1.5, borderColor: '#8A7268' }]}>
              {isDarkMode ? <CartIcon8Dark width={32} height={32} fill="#FFD700" stroke="#FFD700" /> : <CartIcon8 width={32} height={32} />}
            </View>
            {isDarkMode ? <CarrinhoLabel8 width={52} height={10} fill="#FFD700" stroke="#FFD700" /> : <CarrinhoLabel8 width={52} height={10} />}
          </TouchableOpacity>

          <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Opções' })}>
            <View style={isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBg}>
              {isDarkMode ? <GearIcon8Dark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <GearIcon8 width={32} height={32} />}
            </View>
            {isDarkMode ? <OpcoesLabel8 width={42} height={12} fill="#FFFFFF" stroke="#FFFFFF" /> : <OpcoesLabel8 width={42} height={12} />}
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // ========== HEADER ==========
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C2434',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'android' ? 38 : 50,
    paddingBottom: 12,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 36,
    marginLeft: 5,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#1C2434',
    padding: 0,
    height: 36,
  },
  personCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ========== CONTEÚDO (MEIO) ==========
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100, // Dá espaço pra barra inferior não comer o conteúdo
  },
  checkIcon: {
    marginBottom: 40,
  },
  successTitle: {
    marginBottom: 50,
  },
  btnAcompanhar: {
    width: 211,
    height: 75,
    backgroundColor: '#1C2434',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ========== BARRA INFERIOR ==========
  tabBarOuter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: 16,
    right: 16,
  },
  tabBarInner: {
    flexDirection: 'row',
    backgroundColor: '#E3E4EB',
    borderRadius: 30,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabSeparator: {
    width: 1,
    height: 49,
    backgroundColor: '#8A7268',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconBg: {
    width: 51,
    height: 41,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBgActive: {
    backgroundColor: '#E3DAD9',
  },
});
