import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Platform, TouchableOpacity } from 'react-native';
import { useUserMenu } from '../../contexts/UserMenuContext';
import { CatalogHeader } from '../../components/CatalogHeader';

// === IMPORTAÇÃO DOS SVGs (assets/tela12) ===

// Body Title
import SituacaoTit from '../../assets/tela12/Situação da entrega_.svg';

// Step 1 - Pedido Confirmado
import S1Icon from '../../assets/tela12/pedido confirmado/Check-In.svg';
import S1Text from '../../assets/tela12/pedido confirmado/Pedidoh confirmado!.svg';
import S1Check from '../../assets/tela12/pedido confirmado/Check.svg';
import Sep1 from '../../assets/tela12/primeiro separador/Separador.svg';

// Step 2 - Preparando Entrega
import S2Icon from '../../assets/tela12/preparando entrega/Order.svg';
import S2Text from '../../assets/tela12/preparando entrega/Pedido em preparação Pedido preparado!.svg';
import S2SubCheck1 from '../../assets/tela12/preparando entrega/Check-1.svg';
import S2SubCheck2 from '../../assets/tela12/preparando entrega/Check-2.svg';
import S2Time from '../../assets/tela12/preparando entrega/Horário 12_15.svg';
import S2Check from '../../assets/tela12/preparando entrega/Check.svg';
import Sep2 from '../../assets/tela12/segundo separador/Separador.svg';

// Step 3 - Saiu para Entrega
import S3Icon from '../../assets/tela12/saiu para entrega/Fiorino.svg';
import S3Text from '../../assets/tela12/saiu para entrega/Saiu para entrega À caminho.svg';
import S3SubCheck1 from '../../assets/tela12/saiu para entrega/Check.svg';
import S3SubWarn from '../../assets/tela12/saiu para entrega/Warn.svg';
import S3Time from '../../assets/tela12/saiu para entrega/Horário 12_45.svg';
import S3Warn from '../../assets/tela12/saiu para entrega/Warning.svg';
import Sep3 from '../../assets/tela12/terceiro separador/Separador.svg';

// Step 4 - Entrega Concluída
import S4Icon from '../../assets/tela12/entrega concluida/Entrega.svg';
import S4Text from '../../assets/tela12/entrega concluida/Entrega concluída!.svg';
import S4SubWarn from '../../assets/tela12/entrega concluida/Warn red.svg';
import S4Time from '../../assets/tela12/entrega concluida/Horário.svg';
import S4Clock from '../../assets/tela12/entrega concluida/Relógio.svg';
import S4Warn from '../../assets/tela12/entrega concluida/Warning red.svg';

// Custom Thermometer Line Component
const ThermometerLine = ({ color, height = 70 }: { color: string, height?: number }) => (
  <View style={[styles.separatorWrapper, { height }]}>
    <View style={[styles.thermometerStick, { backgroundColor: color, height: height - 6 }]} />
    <View style={[styles.thermometerSquare, { backgroundColor: color }]} />
  </View>
);

// Barra Inferior (Todos inativos, de tela11)
import HomeIcon8 from '../../assets/tela11/barra de baixo/Home.svg';
import MapIcon8 from '../../assets/tela11/barra de baixo/Map.svg';
import CartIcon8 from '../../assets/tela11/barra de baixo/Cart.svg';
import GearIcon8 from '../../assets/tela11/barra de baixo/Gear.svg';
import MenuLabel8 from '../../assets/tela11/barra de baixo/Menu.svg';
import MapaLabel8 from '../../assets/tela11/barra de baixo/Mapa.svg';
import CarrinhoLabel8 from '../../assets/tela11/barra de baixo/Carrinho.svg';
import OpcoesLabel8 from '../../assets/tela11/barra de baixo/Opções.svg';

export default function TrackingScreen({ navigation }: any) {
  const { toggleMenu } = useUserMenu();
  const [searchText, setSearchText] = useState('');

  return (
    <View style={styles.mainContainer}>
      
      {/* ========== HEADER ========== */}
      {/* Header Unificado */}
      <CatalogHeader 
        title="Acompanhar Pedido"
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Título Central */}
        <View style={{ marginBottom: 30 }}>
          <SituacaoTit width={236} height={20} />
        </View>

        {/* ==================== TRACKING FLOW ==================== */}

        {/* STEP 1: Confirmado (Green) */}
        <View style={styles.stepRow}>
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <S1Icon width={45} height={45} />
            </View>
            <View style={[styles.middleBox, { borderRightWidth: 0, alignItems: 'center' }]}>
              <S1Text width={195} height={17} />
            </View>
          </View>
          <View style={styles.outerStatus}>
            <S1Check width={25} height={25} />
          </View>
        </View>

        {/* Custom Linha Verde */}
        <ThermometerLine color="#25BE36" />

        {/* STEP 2: Preparação (Green) */}
        <View style={styles.stepRow}>
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <S2Icon width={45} height={45} />
            </View>
            <View style={styles.middleBox}>
              <View style={styles.subTaskRow}>
                <S2Text width={132} height={58} />
                <View style={styles.subTaskIcons}>
                  <S2SubCheck1 width={15} height={15} style={{ marginBottom: 18 }} />
                  <S2SubCheck2 width={15} height={15} />
                </View>
              </View>
            </View>
            <View style={styles.rightTimeBox}>
               <S2Time width={55} height={40} />
            </View>
          </View>
          <View style={styles.outerStatus}>
            <S2Check width={25} height={25} />
          </View>
        </View>

        {/* Custom Linha Amarela */}
        <ThermometerLine color="#E9A527" />

        {/* STEP 3: Saiu para a entrega (Yellow) */}
        <View style={styles.stepRow}>
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <S3Icon width={50} height={40} />
            </View>
            <View style={styles.middleBox}>
              <View style={styles.subTaskRow}>
                <S3Text width={110} height={58} />
                <View style={styles.subTaskIcons}>
                  <S3SubCheck1 width={15} height={15} style={{ marginBottom: 18 }} />
                  <S3SubWarn width={15} height={15} />
                </View>
              </View>
            </View>
            <View style={styles.rightTimeBox}>
               <S3Time width={55} height={40} />
            </View>
          </View>
          <View style={styles.outerStatus}>
            <S3Warn width={25} height={25} />
          </View>
        </View>

        {/* Custom Linha Vermelha */}
        <ThermometerLine color="#C51818" />

        {/* STEP 4: Entrega Concluída (Red) */}
        <View style={styles.stepRow}>
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <S4Icon width={45} height={45} />
            </View>
            <View style={styles.middleBox}>
              <View style={styles.subTaskRow}>
                <S4Text width={132} height={15} style={{ alignSelf: 'center' }} />
                <S4SubWarn width={15} height={15} style={{ marginLeft: 5 }} />
              </View>
            </View>
            {/* Divisão direita de tempo inativo */}
            <View style={styles.rightTimeBox}>
               <S4Time width={48} height={14} style={{ marginBottom: 6 }} />
               <S4Clock width={24} height={24} />
            </View>
          </View>
          <View style={styles.outerStatus}>
            <S4Warn width={25} height={25} />
          </View>
        </View>

      </ScrollView>

      {/* ========== BARRA INFERIOR (Tudo Inativo) ========== */}
      <View style={styles.tabBarOuter}>
        <View style={styles.tabBarInner}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Menu' })}>
            <View style={styles.iconBgInactive}>
              <HomeIcon8 width={32} height={32} />
            </View>
            <MenuLabel8 width={33} height={9} />
          </TouchableOpacity>
          
          <View style={styles.tabSeparator} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Mapa' })}>
            <View style={styles.iconBgInactive}>
              <MapIcon8 width={32} height={32} />
            </View>
            <MapaLabel8 width={32} height={12} />
          </TouchableOpacity>
          
          <View style={styles.tabSeparator} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Carrinho' })}>
            <View style={styles.iconBgInactive}>
              <CartIcon8 width={32} height={32} />
            </View>
            <CarrinhoLabel8 width={52} height={10} />
          </TouchableOpacity>

          <View style={styles.tabSeparator} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Opções' })}>
            <View style={styles.iconBgInactive}>
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

  // ========== BODY ==========
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 120, // espaço para barra inferior
  },
  
  // === TRACKING LAYOUT ===
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5, // espaçamento antes do separador
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E3E4EB',
    borderRadius: 15,
    minHeight: 85,
    marginRight: 15, // abre espaço para o icone fixo externo
  },
  iconBox: {
    width: 75,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingVertical: 15,
  },
  middleBox: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 15,
    borderRightWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingVertical: 15,
  },
  subTaskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 10,
    alignItems: 'center',
  },
  subTaskIcons: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 5,
  },
  rightTimeBox: {
    width: 75,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  outerStatus: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorWrapper: {
    width: '100%',
    alignItems: 'center',
    // alinhar pelo centro subtraindo o card
    paddingRight: 40,
    marginBottom: 5,
  },
  thermometerStick: {
    width: 3,
  },
  thermometerSquare: {
    width: 6,
    height: 6,
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
  iconBgInactive: {
    width: 51,
    height: 41,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
