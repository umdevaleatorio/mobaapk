import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/client/HomeScreen';
import MapScreen from '../screens/client/MapScreen';
import CartScreen from '../screens/client/CartScreen';
import SettingsScreen from '../screens/client/SettingsScreen';
import { useTheme } from '../contexts/ThemeContext';
// === BARRA SVGs Tela 4 (Menu ativo, outros inativos) ===
import HomeIcon from '../assets/tela4/barra/Home.svg';
import MapIcon from '../assets/tela4/barra/Map.svg';
import CartIcon from '../assets/tela4/barra/Cart.svg';
import GearIcon from '../assets/tela4/barra/Gear.svg';
import MenuLabel from '../assets/tela4/barra/MenuLabel.svg';
import MapaLabel from '../assets/tela4/barra/MapaLabel.svg';
import CarrinhoLabel from '../assets/tela4/barra/CarrinhoLabel.svg';
import OpcoesLabel from '../assets/tela4/barra/OpcoesLabel.svg';

// === BARRA SVGs Tela 6 (Mapa ativo, outros inativos) ===
import HomeIcon6 from '../assets/tela6/barra/Home.svg';
import MapIcon6 from '../assets/tela6/barra/Map.svg';
import CartIcon6 from '../assets/tela6/barra/Cart.svg';
import GearIcon6 from '../assets/tela6/barra/Gear.svg';
import MenuLabel6 from '../assets/tela6/barra/MenuLabel.svg';
import MapaLabel6 from '../assets/tela6/barra/MapaLabel.svg';
import CarrinhoLabel6 from '../assets/tela6/barra/CarrinhoLabel.svg';
import OpcoesLabel6 from '../assets/tela6/barra/OpcoesLabel.svg';

// === BARRA SVGs Tela 7 (Opções ativo) ===
import HomeIcon7 from '../assets/tela7/barra/Home.svg';
import MapIcon7 from '../assets/tela7/barra/Map.svg';
import CartIcon7 from '../assets/tela7/barra/Cart.svg';
import GearIcon7 from '../assets/tela7/barra/Gear.svg';
import MenuLabel7 from '../assets/tela7/barra/MenuLabel.svg';
import MapaLabel7 from '../assets/tela7/barra/MapaLabel.svg';
import CarrinhoLabel7 from '../assets/tela7/barra/CarrinhoLabel.svg';
import OpcoesLabel7 from '../assets/tela7/barra/OpcoesLabel.svg';

// === BARRA SVGs Tela 8 (Carrinho ativo) ===
import HomeIcon8 from '../assets/tela8/barra/Home.svg';
import MapIcon8 from '../assets/tela8/barra/Map.svg';
import CartIcon8 from '../assets/tela8/barra/Cart.svg';
import GearIcon8 from '../assets/tela8/barra/Gear.svg';
import MenuLabel8 from '../assets/tela8/barra/MenuLabel.svg';
import MapaLabel8 from '../assets/tela8/barra/MapaLabel.svg';
import CarrinhoLabel8 from '../assets/tela8/barra/CarrinhoLabel.svg';
import OpcoesLabel8 from '../assets/tela8/barra/OpcoesLabel.svg';

const Tab = createBottomTabNavigator();

export default function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Menu" component={HomeScreen} />
      <Tab.Screen name="Mapa" component={MapScreen} />
      <Tab.Screen name="Carrinho" component={CartScreen} />
      <Tab.Screen name="Opções" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// Configs por tab — cada tela ativa tem seus próprios SVGs com cores corretas
// Tela 4 (Menu ativo): Menu é laranja, outros são neutros
// Tela 6 (Mapa ativo): Mapa é laranja, outros são neutros
const tabConfigs: Record<string, Record<string, { Icon: any; Label: any; labelW: number; labelH: number }>> = {
  Menu: {
    Menu: { Icon: HomeIcon, Label: MenuLabel, labelW: 33, labelH: 9 },
    Mapa: { Icon: MapIcon, Label: MapaLabel, labelW: 32, labelH: 12 },
    Carrinho: { Icon: CartIcon, Label: CarrinhoLabel, labelW: 52, labelH: 10 },
    Opções: { Icon: GearIcon, Label: OpcoesLabel, labelW: 42, labelH: 12 },
  },
  Mapa: {
    Menu: { Icon: HomeIcon6, Label: MenuLabel6, labelW: 33, labelH: 9 },
    Mapa: { Icon: MapIcon6, Label: MapaLabel6, labelW: 32, labelH: 12 },
    Carrinho: { Icon: CartIcon6, Label: CarrinhoLabel6, labelW: 52, labelH: 10 },
    Opções: { Icon: GearIcon6, Label: OpcoesLabel6, labelW: 42, labelH: 12 },
  },
  Carrinho: {
    Menu: { Icon: HomeIcon8, Label: MenuLabel8, labelW: 33, labelH: 9 },
    Mapa: { Icon: MapIcon8, Label: MapaLabel8, labelW: 32, labelH: 12 },
    Carrinho: { Icon: CartIcon8, Label: CarrinhoLabel8, labelW: 52, labelH: 10 },
    Opções: { Icon: GearIcon8, Label: OpcoesLabel8, labelW: 42, labelH: 12 },
  },
  Opções: {
    Menu: { Icon: HomeIcon7, Label: MenuLabel7, labelW: 33, labelH: 9 },
    Mapa: { Icon: MapIcon7, Label: MapaLabel7, labelW: 32, labelH: 12 },
    Carrinho: { Icon: CartIcon7, Label: CarrinhoLabel7, labelW: 52, labelH: 10 },
    Opções: { Icon: GearIcon7, Label: OpcoesLabel7, labelW: 42, labelH: 12 },
  },
};

/**
 * Tab bar customizada seguindo fielmente o design:
 * - Barra Central: #E3E4EB, rx=30, 361x80
 * - Fundo ativo: #E3DAD9, 51x41, rx=20
 * - Separadores: #8A7268, 1x49
 * - Ícones: 32x32
 * - Labels: SVGs com tamanho exato do Figma
 */
function CustomTabBar({ state, navigation }: any) {
  const { isDarkMode } = useTheme();

  return (
    <View style={styles.tabBarOuter}>
      {/* Barra Central (#E3E4EB, rx=30) */}
      <View style={[styles.tabBarInner, { backgroundColor: isDarkMode ? '#000000' : '#E3E4EB' }]}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const activeTab = state.routes[state.index].name;
          const config = (tabConfigs[activeTab] || tabConfigs.Menu)[route.name];
          const { Icon, Label, labelW, labelH } = config;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconColor = isDarkMode ? (isFocused ? '#FFD700' : '#FFFFFF') : undefined;

          const activeBgStyle = isFocused
            ? (isDarkMode
                ? { backgroundColor: '#FFFFFF', width: 51, height: 41, borderRadius: 15, alignItems: 'center' as const, justifyContent: 'center' as const }
                : { backgroundColor: '#E3DAD9', borderWidth: 1.5, borderColor: '#8A7268', width: 51, height: 41, borderRadius: 15, alignItems: 'center' as const, justifyContent: 'center' as const }
              )
            : { width: 51, height: 41, borderRadius: 15, alignItems: 'center' as const, justifyContent: 'center' as const };

          return (
            <React.Fragment key={route.name}>
              {/* Separador: 1x49, #8A7268 (antes de cada tab exceto primeiro) */}
              {index > 0 && (
                <View 
                  style={[
                    styles.tabSeparator, 
                    { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }
                  ]} 
                />
              )}

              <TouchableOpacity
                style={styles.tabItem}
                onPress={onPress}
                activeOpacity={0.7}
              >
                {/* Fundo do ícone (51x41, rx=15, #E3DAD9 com borda #8A7268 quando ativo no modo claro, ou #FFFFFF sem borda no tema escuro) */}
                <View style={activeBgStyle}>
                  <Icon 
                    width={32} 
                    height={32} 
                    fill={iconColor} 
                    stroke={iconColor} 
                  />
                </View>
                {/* Label SVG */}
                <Label 
                  width={labelW} 
                  height={labelH} 
                  fill={iconColor} 
                  stroke={iconColor} 
                />
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container da barra — posição fixa embaixo
  tabBarOuter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: 16,
    right: 16,
  },
  // Barra Central: SVG 361x80, rx=30, #E3E4EB
  tabBarInner: {
    flexDirection: 'row',
    backgroundColor: '#E3E4EB',
    borderRadius: 30,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  // Separador: SVG 1x49, #8A7268
  tabSeparator: {
    width: 1,
    height: 49,
    backgroundColor: '#8A7268',
  },

  // Item individual do tab
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  // Fundo do ícone: Retângulo com borda arredondada 51x41
  iconBg: {
    width: 51,
    height: 41,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Fundo ativo: #E3DAD9 com borda #8A7268 (somente quando focado no modo claro)
  iconBgActive: {
    backgroundColor: '#E3DAD9',
    borderWidth: 1.5,
    borderColor: '#8A7268',
    borderRadius: 15,
    overflow: 'hidden',
  },
});
