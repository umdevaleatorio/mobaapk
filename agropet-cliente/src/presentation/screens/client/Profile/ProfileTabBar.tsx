import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { styles } from './ProfileScreen.styles';
import HomeIcon8 from '../../../assets/tela11/barra de baixo/Home.svg';
import HomeIcon8Dark from '../../../assets/tela8/barra/HomeDark.svg';
import MapIcon8 from '../../../assets/tela11/barra de baixo/Map.svg';
import MapIcon8Dark from '../../../assets/tela8/barra/MapDark.svg';
import CartIcon8 from '../../../assets/tela11/barra de baixo/Cart.svg';
import CartIcon8Dark from '../../../assets/tela8/barra/CartDark.svg';
import GearIcon8 from '../../../assets/tela11/barra de baixo/Gear.svg';
import GearIcon8Dark from '../../../assets/tela8/barra/GearDark.svg';
import MenuLabel8 from '../../../assets/tela11/barra de baixo/Menu.svg';
import MapaLabel8 from '../../../assets/tela11/barra de baixo/Mapa.svg';
import CarrinhoLabel8 from '../../../assets/tela11/barra de baixo/Carrinho.svg';
import OpcoesLabel8 from '../../../assets/tela11/barra de baixo/Opções.svg';

type Props = { h: any };

export default function ProfileTabBar({ h }: Props) {
  return (
    <View style={styles.tabBarOuter}>
      <View style={[styles.tabBarInner, { backgroundColor: h.isDarkMode ? '#000000' : '#E3E4EB' }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => h.navigation.navigate('ClientTabs', { screen: 'Menu' })}>
          <View style={h.isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBgInactive}>
            {h.isDarkMode ? <HomeIcon8Dark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <HomeIcon8 width={32} height={32} />}
          </View>
          {h.isDarkMode ? <MenuLabel8 width={33} height={9} fill="#FFFFFF" stroke="#FFFFFF" /> : <MenuLabel8 width={33} height={9} />}
        </TouchableOpacity>
        <View style={[styles.tabSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

        {h.deliveryActive && (
          <>
            <TouchableOpacity style={styles.tabItem} onPress={() => h.navigation.navigate('ClientTabs', { screen: 'Mapa' })}>
              <View style={h.isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBgInactive}>
                {h.isDarkMode ? <MapIcon8Dark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <MapIcon8 width={32} height={32} />}
              </View>
              {h.isDarkMode ? <MapaLabel8 width={32} height={12} fill="#FFFFFF" stroke="#FFFFFF" /> : <MapaLabel8 width={32} height={12} />}
            </TouchableOpacity>
            <View style={[styles.tabSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />
          </>
        )}
        <TouchableOpacity style={styles.tabItem} onPress={() => h.navigation.navigate('ClientTabs', { screen: 'Carrinho' })}>
          <View style={h.isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBgInactive}>
            {h.isDarkMode ? <CartIcon8Dark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <CartIcon8 width={32} height={32} />}
          </View>
          {h.isDarkMode ? <CarrinhoLabel8 width={52} height={10} fill="#FFFFFF" stroke="#FFFFFF" /> : <CarrinhoLabel8 width={52} height={10} />}
        </TouchableOpacity>
        <View style={[styles.tabSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />
        <TouchableOpacity style={styles.tabItem} onPress={() => h.navigation.navigate('ClientTabs', { screen: 'Opções' })}>
          <View style={h.isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBgInactive}>
            {h.isDarkMode ? <GearIcon8Dark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <GearIcon8 width={32} height={32} />}
          </View>
          {h.isDarkMode ? <OpcoesLabel8 width={42} height={12} fill="#FFFFFF" stroke="#FFFFFF" /> : <OpcoesLabel8 width={42} height={12} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}
