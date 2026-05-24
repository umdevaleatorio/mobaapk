import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, Platform } from 'react-native';
import { useUserMenu } from '../../contexts/UserMenuContext';
import { CatalogHeader } from '../../components/CatalogHeader';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../../data/datasources/supabase/client';

// === IMPORTAÇÃO DOS SVGs (assets/tela10) ===
// Superior
// Removidos MiniLogo, CheckoutTitle, PersonIcon e Lupa (usados no CatalogHeader)

// Meio
import CheckInIcon from '../../assets/tela10/meio/Check-In.svg';
import PedidoConfirmadoTxt from '../../assets/tela10/meio/Pedido Confirmado!.svg';
import BtnAcompanhar from '../../assets/tela10/meio/Acompanhar pedido-1.svg';

// Barra Inferior (Copiando exatamente da tela 8 do Carrinho)
import HomeIcon8 from '../../assets/tela8/barra/Home.svg';
import MapIcon8 from '../../assets/tela8/barra/Map.svg';
import CartIcon8 from '../../assets/tela8/barra/Cart.svg';
import GearIcon8 from '../../assets/tela8/barra/Gear.svg';
import MenuLabel8 from '../../assets/tela8/barra/MenuLabel.svg';
import MapaLabel8 from '../../assets/tela8/barra/MapaLabel.svg';
import CarrinhoLabel8 from '../../assets/tela8/barra/CarrinhoLabel.svg';
import OpcoesLabel8 from '../../assets/tela8/barra/OpcoesLabel.svg';

export default function PaymentConfirmScreen({ route, navigation }: any) {
  const { toggleMenu } = useUserMenu();
  const { isDarkMode } = useTheme();
  const { orderId } = route.params || {};

  const [searchText, setSearchText] = useState('');
  const [deliveryActive, setDeliveryActive] = useState(true);

  // Sincronizar status de frete ativo/inativo na barra inferior
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
        console.log('Error fetching delivery active in confirmation:', e);
      }
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
      </View>

      {/* ========== BARRA INFERIOR (Matches ClientTabs) ========== */}
      <View style={styles.tabBarOuter}>
        <View style={[styles.tabBarInner, { backgroundColor: isDarkMode ? '#000000' : '#E3E4EB' }]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Menu' })}>
            <View style={isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBg}>
              <HomeIcon8 width={32} height={32} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
            </View>
            <MenuLabel8 width={33} height={9} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
          </TouchableOpacity>
          
          <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          {deliveryActive && (
            <>
              <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Mapa' })}>
                <View style={isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBg}>
                  <MapIcon8 width={32} height={32} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
                </View>
                <MapaLabel8 width={32} height={12} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
              </TouchableOpacity>
              
              <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />
            </>
          )}

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Carrinho' })}>
            <View style={isDarkMode ? { backgroundColor: '#FFFFFF', width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : [styles.iconBg, { backgroundColor: '#E3DAD9', borderWidth: 1.5, borderColor: '#8A7268' }]}>
              <CartIcon8 width={32} height={32} fill={isDarkMode ? '#FFD700' : undefined} stroke={isDarkMode ? '#FFD700' : undefined} />
            </View>
            <CarrinhoLabel8 width={52} height={10} fill={isDarkMode ? '#FFD700' : undefined} stroke={isDarkMode ? '#FFD700' : undefined} />
          </TouchableOpacity>

          <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Opções' })}>
            <View style={isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBg}>
              <GearIcon8 width={32} height={32} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
            </View>
            <OpcoesLabel8 width={42} height={12} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
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
