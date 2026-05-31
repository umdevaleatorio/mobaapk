import React from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { CatalogHeader } from '../../../components/CatalogHeader';

import SituacaoTit from '../../../assets/tela12/Situação da entrega_.svg';
import S1Icon from '../../../assets/tela12/pedido confirmado/Check-In.svg';
import S1Text from '../../../assets/tela12/pedido confirmado/Pedidoh confirmado!.svg';
import S1Check from '../../../assets/tela12/pedido confirmado/Check.svg';
import Sep1 from '../../../assets/tela12/primeiro separador/Separador.svg';
import S2Icon from '../../../assets/tela12/preparando entrega/Order.svg';
import S2Text from '../../../assets/tela12/preparando entrega/Pedido em preparação Pedido preparado!.svg';
import S2SubCheck1 from '../../../assets/tela12/preparando entrega/Check-1.svg';
import S2SubCheck2 from '../../../assets/tela12/preparando entrega/Check-2.svg';
import S2Time from '../../../assets/tela12/preparando entrega/Horário 12_15.svg';
import S2Check from '../../../assets/tela12/preparando entrega/Check.svg';
import Sep2 from '../../../assets/tela12/segundo separador/Separador.svg';
import S3Icon from '../../../assets/tela12/saiu para entrega/Fiorino.svg';
import S3Text from '../../../assets/tela12/saiu para entrega/Saiu para entrega À caminho.svg';
import S3SubCheck1 from '../../../assets/tela12/saiu para entrega/Check.svg';
import S3SubWarn from '../../../assets/tela12/saiu para entrega/Warn.svg';
import S3Time from '../../../assets/tela12/saiu para entrega/Horário 12_45.svg';
import S3Warn from '../../../assets/tela12/saiu para entrega/Warning.svg';
import Sep3 from '../../../assets/tela12/terceiro separador/Separador.svg';
import S4Icon from '../../../assets/tela12/entrega concluida/Entrega.svg';
import S4Text from '../../../assets/tela12/entrega concluida/Entrega concluída!.svg';
import S4SubWarn from '../../../assets/tela12/entrega concluida/Warn red.svg';
import S4Time from '../../../assets/tela12/entrega concluida/Horário.svg';
import S4Clock from '../../../assets/tela12/entrega concluida/Relógio.svg';
import S4Warn from '../../../assets/tela12/entrega concluida/Warning red.svg';
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

import { useTrackingScreen } from './useTrackingScreen';
import { styles } from './TrackingScreen.styles';
import { ThermometerLine } from './ThermometerLine';

export default function TrackingScreen({ navigation }: any) {
  const h = useTrackingScreen();

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.colors.background }]}>
      <CatalogHeader
        title="Acompanhar Pedido"
        searchText={h.searchText}
        onSearchChange={h.setSearchText}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ marginBottom: 30, alignItems: 'flex-start' }}>
          {h.isDarkMode ? (
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', height: 20 }}>Situação da entrega</Text>
          ) : (
            <SituacaoTit width={236} height={20} />
          )}
        </View>

        <View style={styles.stepRow}>
          <View style={[styles.card, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#E3E4EB' }]}>
            <View style={[styles.iconBox, { borderColor: h.isDarkMode ? 'rgba(255,255,255,0.15)' : '#FFFFFF' }]}>
              <S1Icon width={45} height={45} />
            </View>
            <View style={[styles.middleBox, { borderRightWidth: 0, alignItems: 'center', borderColor: h.isDarkMode ? 'rgba(255,255,255,0.15)' : '#FFFFFF' }]}>
              {h.isDarkMode ? (
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#FFFFFF' }}>Pedido confirmado!</Text>
              ) : (
                <S1Text width={195} height={17} />
              )}
            </View>
          </View>
          <View style={styles.outerStatus}>
            <S1Check width={25} height={25} />
          </View>
        </View>

        <ThermometerLine color="#25BE36" />

        <View style={styles.stepRow}>
          <View style={[styles.card, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#E3E4EB' }]}>
            <View style={[styles.iconBox, { borderColor: h.isDarkMode ? 'rgba(255,255,255,0.15)' : '#FFFFFF' }]}>
              <S2Icon width={45} height={45} />
            </View>
            <View style={[styles.middleBox, { borderColor: h.isDarkMode ? 'rgba(255,255,255,0.15)' : '#FFFFFF' }]}>
              <View style={styles.subTaskRow}>
                {h.isDarkMode ? (
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', lineHeight: 18 }}>
                    Pedido em preparação{"\n"}Pedido preparado!
                  </Text>
                ) : (
                  <S2Text width={132} height={58} />
                )}
                <View style={styles.subTaskIcons}>
                  <S2SubCheck1 width={15} height={15} style={{ marginBottom: 18 }} />
                  <S2SubCheck2 width={15} height={15} />
                </View>
              </View>
            </View>
            <View style={styles.rightTimeBox}>
              {h.isDarkMode ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 2 }}>Horário</Text>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>12:15</Text>
                </View>
              ) : (
                <S2Time width={55} height={40} />
              )}
            </View>
          </View>
          <View style={styles.outerStatus}>
            <S2Check width={25} height={25} />
          </View>
        </View>

        <ThermometerLine color="#E9A527" />

        <View style={styles.stepRow}>
          <View style={[styles.card, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#E3E4EB' }]}>
            <View style={[styles.iconBox, { borderColor: h.isDarkMode ? 'rgba(255,255,255,0.15)' : '#FFFFFF' }]}>
              <S3Icon width={50} height={40} />
            </View>
            <View style={[styles.middleBox, { borderColor: h.isDarkMode ? 'rgba(255,255,255,0.15)' : '#FFFFFF' }]}>
              <View style={styles.subTaskRow}>
                {h.isDarkMode ? (
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', lineHeight: 18 }}>
                    Saiu para entrega{"\n"}À caminho
                  </Text>
                ) : (
                  <S3Text width={110} height={58} />
                )}
                <View style={styles.subTaskIcons}>
                  <S3SubCheck1 width={15} height={15} style={{ marginBottom: 18 }} />
                  <S3SubWarn width={15} height={15} />
                </View>
              </View>
            </View>
            <View style={styles.rightTimeBox}>
              {h.isDarkMode ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 2 }}>Horário</Text>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>12:45</Text>
                </View>
              ) : (
                <S3Time width={55} height={40} />
              )}
            </View>
          </View>
          <View style={styles.outerStatus}>
            <S3Warn width={25} height={25} />
          </View>
        </View>

        <ThermometerLine color="#C51818" />

        <View style={styles.stepRow}>
          <View style={[styles.card, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#E3E4EB' }]}>
            <View style={[styles.iconBox, { borderColor: h.isDarkMode ? 'rgba(255,255,255,0.15)' : '#FFFFFF' }]}>
              <S4Icon width={45} height={45} />
            </View>
            <View style={[styles.middleBox, { borderColor: h.isDarkMode ? 'rgba(255,255,255,0.15)' : '#FFFFFF' }]}>
              <View style={styles.subTaskRow}>
                {h.isDarkMode ? (
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', alignSelf: 'center' }}>
                    Entrega concluída!
                  </Text>
                ) : (
                  <S4Text width={132} height={15} style={{ alignSelf: 'center' }} />
                )}
                <S4SubWarn width={15} height={15} style={{ marginLeft: 5 }} />
              </View>
            </View>
            <View style={styles.rightTimeBox}>
              {h.isDarkMode ? (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6, textAlign: 'center' }}>Horário</Text>
                  <S4Clock width={24} height={24} fill="#FFFFFF" stroke="#FFFFFF" />
                </View>
              ) : (
                <>
                  <S4Time width={48} height={14} style={{ marginBottom: 6 }} />
                  <S4Clock width={24} height={24} />
                </>
              )}
            </View>
          </View>
          <View style={styles.outerStatus}>
            <S4Warn width={25} height={25} />
          </View>
        </View>
      </ScrollView>
      <View style={styles.tabBarOuter}>
        <View style={[styles.tabBarInner, { backgroundColor: h.isDarkMode ? '#000000' : '#E3E4EB' }]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Menu' })}>
            <View style={h.isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBgInactive}>
              {h.isDarkMode ? <HomeIcon8Dark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <HomeIcon8 width={32} height={32} />}
            </View>
            {h.isDarkMode ? <MenuLabel8 width={33} height={9} fill="#FFFFFF" stroke="#FFFFFF" /> : <MenuLabel8 width={33} height={9} />}
          </TouchableOpacity>

          <View style={[styles.tabSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Mapa' })}>
            <View style={h.isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBgInactive}>
              {h.isDarkMode ? <MapIcon8Dark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <MapIcon8 width={32} height={32} />}
            </View>
            {h.isDarkMode ? <MapaLabel8 width={32} height={12} fill="#FFFFFF" stroke="#FFFFFF" /> : <MapaLabel8 width={32} height={12} />}
          </TouchableOpacity>

          <View style={[styles.tabSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Carrinho' })}>
            <View style={h.isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBgInactive}>
              {h.isDarkMode ? <CartIcon8Dark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <CartIcon8 width={32} height={32} />}
            </View>
            {h.isDarkMode ? <CarrinhoLabel8 width={52} height={10} fill="#FFFFFF" stroke="#FFFFFF" /> : <CarrinhoLabel8 width={52} height={10} />}
          </TouchableOpacity>

          <View style={[styles.tabSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Opções' })}>
            <View style={h.isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBgInactive}>
              {h.isDarkMode ? <GearIcon8Dark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <GearIcon8 width={32} height={32} />}
            </View>
            {h.isDarkMode ? <OpcoesLabel8 width={42} height={12} fill="#FFFFFF" stroke="#FFFFFF" /> : <OpcoesLabel8 width={42} height={12} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
