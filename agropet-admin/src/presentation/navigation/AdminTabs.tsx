import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../contexts/ThemeContext';

// Admin Screens
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminMapScreen from '../screens/admin/AdminMapScreen';
import ManageProductsScreen from '../screens/admin/ManageProductsScreen';
import AdminSettingsScreen from '../screens/admin/AdminSettingsScreen';
import ProductCreateScreen from '../screens/admin/ProductCreateScreen';
import ProductEditScreen from '../screens/admin/ProductEditScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';

// SVGs Admin Barra (Tela 2)
import HomeIcon from '../assets/tela2/barra/Home.svg';
import HomeLabel from '../assets/tela2/barra/Menu.svg';
import MapIcon from '../assets/tela2/barra/Map.svg';
import MapLabel from '../assets/tela2/barra/Mapa.svg';
import ManageIcon from '../assets/tela2/barra/Manage.svg';
import ManageLabel from '../assets/tela2/barra/Gerenciar.svg';
import GearIcon from '../assets/tela2/barra/Gear.svg';
import OpcoesLabel from '../assets/tela2/barra/Opções.svg';

// SVGs Admin Barra (Tela 3 - Mapa ativo)
import HomeIcon3 from '../assets/tela3/barra/Home.svg';
import HomeLabel3 from '../assets/tela3/barra/Menu.svg';
import MapIcon3 from '../assets/tela3/barra/Map.svg';
import MapLabel3 from '../assets/tela3/barra/Mapa.svg';
import ManageIcon3 from '../assets/tela3/barra/Manage.svg';
import ManageLabel3 from '../assets/tela3/barra/Gerenciar.svg';
import GearIcon3 from '../assets/tela3/barra/Gear.svg';
import OpcoesLabel3 from '../assets/tela3/barra/Opções.svg';

// SVGs Admin Barra (Tela 4 - Opções ativo)
import HomeIcon4 from '../assets/tela4/barra/Home.svg';
import HomeLabel4 from '../assets/tela4/barra/Menu.svg';
import MapIcon4 from '../assets/tela4/barra/Map.svg';
import MapLabel4 from '../assets/tela4/barra/Mapa.svg';
import ManageIcon4 from '../assets/tela4/barra/Manage.svg';
import ManageLabel4 from '../assets/tela4/barra/Gerenciar.svg';
import GearIcon4 from '../assets/tela4/barra/Gear.svg';
import OpcoesLabel4 from '../assets/tela4/barra/Opções.svg';

// SVGs Admin Barra (Tela 7 - Gerenciar ativo)
import HomeIcon7 from '../assets/tela7/barra de baix/Adicionar/Remover/Home.svg';
import HomeLabel7 from '../assets/tela7/barra de baix/Adicionar/Remover/Menu.svg';
import MapIcon7 from '../assets/tela7/barra de baix/Adicionar/Remover/Map.svg';
import MapLabel7 from '../assets/tela7/barra de baix/Adicionar/Remover/Mapa.svg';
import ManageIcon7 from '../assets/tela7/barra de baix/Adicionar/Remover/Manage.svg';
import ManageLabel7 from '../assets/tela7/barra de baix/Adicionar/Remover/Gerenciar.svg';
import GearIcon7 from '../assets/tela7/barra de baix/Adicionar/Remover/Gear.svg';
import OpcoesLabel7 from '../assets/tela7/barra de baix/Adicionar/Remover/Opções.svg';
import FundoAtivoSvg from '../assets/tela8/barra de baixo/Fundo.svg';

const Tab = createBottomTabNavigator();

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={AdminHomeScreen} />
      <Tab.Screen name="Mapa" component={AdminMapScreen} />
      <Tab.Screen name="Gerenciar" component={ManageProductsScreen} />
      <Tab.Screen 
        name="ProductCreateScreen" 
        component={ProductCreateScreen} 
        options={{ tabBarButton: () => null }} 
      />
      <Tab.Screen 
        name="ProductEditScreen" 
        component={ProductEditScreen} 
        options={{ tabBarButton: () => null }} 
      />
      <Tab.Screen 
        name="AdminProfile" 
        component={AdminProfileScreen} 
        options={{ tabBarButton: () => null }} 
      />
      <Tab.Screen name="Opções" component={AdminSettingsScreen} />
    </Tab.Navigator>
  );
}

const tabConfigs: any = {
  Home: {
    Home: { Icon: HomeIcon, Label: HomeLabel, labelW: 33, labelH: 9 },
    Mapa: { Icon: MapIcon, Label: MapLabel, labelW: 32, labelH: 12 },
    Gerenciar: { Icon: ManageIcon, Label: ManageLabel, labelW: 55, labelH: 10 },
    Opções: { Icon: GearIcon, Label: OpcoesLabel, labelW: 42, labelH: 12 },
  },
  Mapa: {
    Home: { Icon: HomeIcon3, Label: HomeLabel3, labelW: 33, labelH: 9 },
    Mapa: { Icon: MapIcon3, Label: MapLabel3, labelW: 32, labelH: 12 },
    Gerenciar: { Icon: ManageIcon3, Label: ManageLabel3, labelW: 55, labelH: 10 },
    Opções: { Icon: GearIcon3, Label: OpcoesLabel3, labelW: 42, labelH: 12 },
  },
  Gerenciar: {
    Home: { Icon: HomeIcon7, Label: HomeLabel7, labelW: 33, labelH: 9 },
    Mapa: { Icon: MapIcon7, Label: MapLabel7, labelW: 32, labelH: 12 },
    Gerenciar: { Icon: ManageIcon7, Label: ManageLabel7, labelW: 57, labelH: 10 },
    Opções: { Icon: GearIcon7, Label: OpcoesLabel7, labelW: 42, labelH: 12 },
  },
  Opções: {
    Home: { Icon: HomeIcon4, Label: HomeLabel4, labelW: 33, labelH: 9 },
    Mapa: { Icon: MapIcon4, Label: MapLabel4, labelW: 32, labelH: 12 },
    Gerenciar: { Icon: ManageIcon4, Label: ManageLabel4, labelW: 55, labelH: 10 },
    Opções: { Icon: GearIcon4, Label: OpcoesLabel4, labelW: 42, labelH: 12 },
  },
  ProductCreateScreen: {
    Home: { Icon: HomeIcon7, Label: HomeLabel7, labelW: 33, labelH: 9 },
    Mapa: { Icon: MapIcon7, Label: MapLabel7, labelW: 32, labelH: 12 },
    Gerenciar: { Icon: ManageIcon7, Label: ManageLabel7, labelW: 57, labelH: 10 },
    Opções: { Icon: GearIcon7, Label: OpcoesLabel7, labelW: 42, labelH: 12 },
  },
  ProductEditScreen: {
    Home: { Icon: HomeIcon7, Label: HomeLabel7, labelW: 33, labelH: 9 },
    Mapa: { Icon: MapIcon7, Label: MapLabel7, labelW: 32, labelH: 12 },
    Gerenciar: { Icon: ManageIcon7, Label: ManageLabel7, labelW: 57, labelH: 10 },
    Opções: { Icon: GearIcon7, Label: OpcoesLabel7, labelW: 42, labelH: 12 },
  },
  AdminProfile: {
    Home: { Icon: HomeIcon4, Label: HomeLabel4, labelW: 33, labelH: 9 },
    Mapa: { Icon: MapIcon4, Label: MapLabel4, labelW: 32, labelH: 12 },
    Gerenciar: { Icon: ManageIcon4, Label: ManageLabel4, labelW: 55, labelH: 10 },
    Opções: { Icon: GearIcon, Label: OpcoesLabel, labelW: 42, labelH: 12 },
  },
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  // Ocultar barra inferior se o mapa estiver em modo de rastreamento (mapa expandido)
  const activeRoute = state.routes[state.index];
  const isMapTracking = activeRoute.name === 'Mapa' && activeRoute.params?.clientLocation;
  if (isMapTracking) return null;

  const focusedOptions = descriptors[state.routes[state.index].key].options;
  if (focusedOptions.tabBarVisible === false) return null;

  const { isDarkMode } = useTheme();
  const [tabPositions, setTabPositions] = React.useState<Record<number, { x: number; width: number }>>({});
  const translateX = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  const activeTab = state.routes[state.index].name;

  const getHighlightedRouteIndex = () => {
    if (activeTab === 'AdminProfile') return -1;
    if (activeTab === 'ProductCreateScreen' || activeTab === 'ProductEditScreen') {
      return state.routes.findIndex((r: any) => r.name === 'Gerenciar');
    }
    return state.index;
  };

  const highlightedIndex = getHighlightedRouteIndex();

  React.useEffect(() => {
    if (highlightedIndex !== -1 && tabPositions[highlightedIndex]) {
      const { x, width } = tabPositions[highlightedIndex];
      const targetX = x + (width - 51) / 2;
      
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: targetX,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [highlightedIndex, tabPositions]);

  const slidingBgStyle = [
    styles.iconBg,
    {
      position: 'absolute' as const,
      left: 0,
      width: 51,
      height: 41,
      borderRadius: 20,
      transform: [{ translateX }],
      opacity: opacityAnim,
      top: 12,
    },
    isDarkMode
      ? { backgroundColor: '#FFFFFF' }
      : { backgroundColor: '#E3DAD9', borderWidth: 0 }
  ];

  return (
    <View style={styles.tabBarOuter}>
      <View style={[styles.tabBarInner, { backgroundColor: isDarkMode ? '#000000' : '#E3E4EB' }]}>
        <Animated.View style={slidingBgStyle} />

        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          
          let isTabActive = isFocused;
          if (route.name === 'Gerenciar' && (activeTab === 'ProductCreateScreen' || activeTab === 'ProductEditScreen')) {
            isTabActive = true;
          }
          if (activeTab === 'AdminProfile') {
            isTabActive = false;
          }

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const config = (tabConfigs[activeTab] || tabConfigs.Home)[route.name];
          if (!config) return null;

          const { Icon, Label, labelW, labelH } = config;
          const iconColor = isDarkMode ? (isTabActive ? '#FFD700' : '#FFFFFF') : undefined;

          return (
            <React.Fragment key={route.key}>
              {index > 0 && (
                <View 
                  style={[
                    styles.tabSeparator, 
                    { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }
                  ]} 
                />
              )}
              <TouchableOpacity
                onPress={onPress}
                style={styles.tabItem}
                activeOpacity={0.7}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  setTabPositions(prev => ({
                    ...prev,
                    [index]: { x, width }
                  }));
                }}
              >
                <View style={styles.iconBg}>
                  <Icon 
                    width={32} 
                    height={32} 
                    fill={iconColor} 
                    stroke={iconColor} 
                  />
                </View>
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
});
