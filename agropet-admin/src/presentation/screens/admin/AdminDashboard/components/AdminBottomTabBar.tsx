import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { styles } from './AdminBottomTabBar.styles';

// Bottom Bar Icons
import HomeIcon8 from '../../../../assets/tela5/barra de baixo/Home.svg';
import HomeIcon8Dark from '../../../../assets/tela4/barra/HomeDark.svg';
import MapIcon8 from '../../../../assets/tela5/barra de baixo/Map.svg';
import MapIcon8Dark from '../../../../assets/tela4/barra/MapDark.svg';
import ManageIcon8 from '../../../../assets/tela2/barra/Manage.svg';
import ManageIcon8Dark from '../../../../assets/tela2/barra/ManageDark.svg';
import GearIcon8 from '../../../../assets/tela5/barra de baixo/Gear.svg';
import GearIcon8Dark from '../../../../assets/tela4/barra/GearDark.svg';
import MenuLabel8 from '../../../../assets/tela5/barra de baixo/Menu.svg';
import MapaLabel8 from '../../../../assets/tela5/barra de baixo/Mapa.svg';
import GerenciarLabel8 from '../../../../assets/tela2/barra/Gerenciar.svg';
import OpcoesLabel8 from '../../../../assets/tela5/barra de baixo/Opções.svg';

interface AdminBottomTabBarProps {
  isDarkMode: boolean;
  iconColorInactive?: string;
}

export default function AdminBottomTabBar({ isDarkMode, iconColorInactive }: AdminBottomTabBarProps) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.tabBarOuter}>
      <View style={[styles.tabBarInner, { backgroundColor: isDarkMode ? '#000000' : '#E3E4EB' }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('AdminTabs', { screen: 'Home' })}>
          <View style={styles.iconBgInactive}>
            {isDarkMode ? <HomeIcon8Dark width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} /> : <HomeIcon8 width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} />}
          </View>
          <MenuLabel8 width={33} height={9} fill={iconColorInactive} stroke={iconColorInactive} />
        </TouchableOpacity>
        <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('AdminTabs', { screen: 'Mapa' })}>
          <View style={styles.iconBgInactive}>
            {isDarkMode ? <MapIcon8Dark width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} /> : <MapIcon8 width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} />}
          </View>
          <MapaLabel8 width={32} height={12} fill={iconColorInactive} stroke={iconColorInactive} />
        </TouchableOpacity>
        <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('AdminTabs', { screen: 'Gerenciar' })}>
          <View style={styles.iconBgInactive}>
            {isDarkMode ? <ManageIcon8Dark width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} /> : <ManageIcon8 width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} />}
          </View>
          <GerenciarLabel8 width={55} height={10} fill={iconColorInactive} stroke={iconColorInactive} />
        </TouchableOpacity>
        <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('AdminTabs', { screen: 'Opções' })}>
          <View style={styles.iconBgInactive}>
            {isDarkMode ? <GearIcon8Dark width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} /> : <GearIcon8 width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} />}
          </View>
          <OpcoesLabel8 width={42} height={12} fill={iconColorInactive} stroke={iconColorInactive} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
