import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, StatusBar, Platform } from 'react-native';
import { useUserMenu } from '../../contexts/UserMenuContext';
import { CatalogHeader } from '../../components/CatalogHeader';

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
  const { orderId } = route.params || {};

  const [searchText, setSearchText] = useState('');

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#1C2434" barStyle="light-content" />

      {/* Header Unificado */}
      <CatalogHeader 
        title="Checkout"
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      {/* ========== CONTEÚDO (MEIO) ========== */}
      <View style={styles.contentContainer}>
        <CheckInIcon width={181} height={181} style={styles.checkIcon} />
        <PedidoConfirmadoTxt width={194} height={80} style={styles.successTitle} />
        
        <TouchableOpacity
          style={styles.btnAcompanhar}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('OrdersScreen')}
        >
          <BtnAcompanhar width={154} height={45} />
        </TouchableOpacity>
      </View>

      {/* ========== BARRA INFERIOR (Matches ClientTabs) ========== */}
      <View style={styles.tabBarOuter}>
        <View style={styles.tabBarInner}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Menu' })}>
            <View style={styles.iconBg}>
              <HomeIcon8 width={32} height={32} />
            </View>
            <MenuLabel8 width={33} height={9} />
          </TouchableOpacity>
          
          <View style={styles.tabSeparator} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Mapa' })}>
            <View style={styles.iconBg}>
              <MapIcon8 width={32} height={32} />
            </View>
            <MapaLabel8 width={32} height={12} />
          </TouchableOpacity>
          
          <View style={styles.tabSeparator} />

          {/* Carrinho continua como a aba "ativa" (mesmo efeito da T9 e T8) */}
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Carrinho' })}>
            <View style={[styles.iconBg, styles.iconBgActive]}>
              <CartIcon8 width={32} height={32} />
            </View>
            <CarrinhoLabel8 width={52} height={10} />
          </TouchableOpacity>

          <View style={styles.tabSeparator} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Opções' })}>
            <View style={styles.iconBg}>
              <GearIcon8 width={32} height={32} />
            </View>
            <OpcoesLabel8 width={42} height={12} />
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
