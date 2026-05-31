import React from 'react';
import { View, Text, Alert, ActivityIndicator, ScrollView, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { CartContext } from '../../../contexts/CartContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { CatalogHeader } from '../../../components/CatalogHeader';
import { Feather } from '@expo/vector-icons';

import ResumoTitle from '../../../assets/tela9/Resumo do pedido_.svg';
import ProdutoHdr from '../../../assets/tela9/resumo/Produto.svg';
import QuantidadeHdr from '../../../assets/tela9/resumo/Quantidade.svg';
import PrecoHdr from '../../../assets/tela9/resumo/Preço.svg';
import TotalPedido from '../../../assets/tela9/resumo/Total do pedido_.svg';
import PixTxt from '../../../assets/tela9/pagamento/PIX.svg';
import UpsideDown from '../../../assets/tela9/pagamento/Upside Down.svg';
import InstructionTxt from '../../../assets/tela9/pagamento/Escolha a forma de pagamento e clique em fazer pedido em seguida!.svg';
import FazerPedidoTxt from '../../../assets/tela9/pagamento/Fazer Pedido!.svg';
import HomeIcon8 from '../../../assets/tela8/barra/Home.svg';
import HomeIcon8Dark from '../../../assets/tela8/barra/HomeDark.svg';
import MapIcon8 from '../../../assets/tela8/barra/Map.svg';
import MapIcon8Dark from '../../../assets/tela8/barra/MapDark.svg';
import CartIcon8 from '../../../assets/tela8/barra/Cart.svg';
import CartIcon8Dark from '../../../assets/tela8/barra/CartDark.svg';
import GearIcon8 from '../../../assets/tela8/barra/Gear.svg';
import GearIcon8Dark from '../../../assets/tela8/barra/GearDark.svg';
import MenuLabel8 from '../../../assets/tela8/barra/MenuLabel.svg';
import MapaLabel8 from '../../../assets/tela8/barra/MapaLabel.svg';
import CarrinhoLabel8 from '../../../assets/tela8/barra/CarrinhoLabel.svg';
import OpcoesLabel8 from '../../../assets/tela8/barra/OpcoesLabel.svg';

import { usePaymentScreen } from './usePaymentScreen';
import { styles } from './PaymentScreen.styles';

export default function PaymentScreen({ navigation }: any) {
  const h = usePaymentScreen();

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <StatusBar backgroundColor={h.isDarkMode ? '#121212' : '#1C2434'} barStyle="light-content" />

      <CatalogHeader
        title="Checkout"
        searchText={h.searchText}
        onSearchChange={h.setSearchText}
      />

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }}>Resumo do pedido</Text>
        </View>

        <View style={[styles.resumoCard, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#1C2434' }]}>
          <View style={[styles.tRow, { borderBottomWidth: 1.5, borderColor: h.isDarkMode ? '#121212' : '#F5F5F5' }]}>
            <View style={styles.tColProduto}><ProdutoHdr width={62} height={15} /></View>
            <View style={[styles.tColDivider, { backgroundColor: h.isDarkMode ? '#121212' : '#F5F5F5' }]} />
            <View style={styles.tColQty}><QuantidadeHdr width={87} height={15} /></View>
            <View style={[styles.tColDivider, { backgroundColor: h.isDarkMode ? '#121212' : '#F5F5F5' }]} />
            <View style={styles.tColPreco}><PrecoHdr width={45} height={15} /></View>
          </View>

          {h.cart.map((item, index) => (
            <View key={index} style={[styles.tRow, { borderBottomWidth: 1.5, borderColor: h.isDarkMode ? '#121212' : '#F5F5F5' }]}>
              <View style={styles.tColProduto}>
                <Text style={styles.itemText} numberOfLines={2}>{item.name}</Text>
              </View>
              <View style={[styles.tColDivider, { backgroundColor: h.isDarkMode ? '#121212' : '#F5F5F5' }]} />
              <View style={styles.tColQty}>
                <Text style={styles.itemTextGrande}>{item.quantity}</Text>
              </View>
              <View style={[styles.tColDivider, { backgroundColor: h.isDarkMode ? '#121212' : '#F5F5F5' }]} />
              <View style={styles.tColPreco}>
                <Text style={styles.itemText}>R$ {item.price.toFixed(2)}</Text>
              </View>
            </View>
          ))}

          <View style={styles.tRow}>
            <View style={[styles.tColProduto, { flex: 0, width: '60%', alignItems: 'flex-start', paddingLeft: 16 }]}>
              <TotalPedido width={143} height={17} />
            </View>
            <View style={[styles.tColDivider, { backgroundColor: h.isDarkMode ? '#121212' : '#F5F5F5' }]} />
            <View style={[styles.tColPreco, { flex: 1 }]}>
              <Text style={styles.itemTotal}>R$ {h.grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }}>Forma de pagamento</Text>
        </View>

        <View style={[styles.paymentCard, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
          <TouchableOpacity
            style={[styles.dropdownBox, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF' }]}
            activeOpacity={0.8}
            onPress={() => h.setIsDropdownOpen(!h.isDropdownOpen)}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }}>{h.paymentMethod}</Text>
            <Feather name="chevron-down" size={24} color={h.isDarkMode ? '#FFFFFF' : '#1C2434'} style={{ transform: [{ rotate: h.isDropdownOpen ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>

          {h.isDropdownOpen && (
            <View style={[styles.dropdownList, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
              {['PIX', 'Cartão/Débito', 'Cartão/Crédito', 'Dinheiro'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[styles.dropdownItem, { borderColor: h.isDarkMode ? '#3E3E4A' : '#F0F0F0' }]}
                  onPress={() => { h.setPaymentMethod(method); h.setIsDropdownOpen(false); }}
                >
                  <Text style={[styles.dropdownText, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}>{method}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.instructionBox}>
            <Text style={{ color: h.isDarkMode ? '#FFFFFF' : '#1C2434', fontSize: 13, fontWeight: 'bold', textAlign: 'center' }}>
              Escolha a forma de pagamento e clique em fazer pedido em seguida!
            </Text>
          </View>

          {h.loading ? (
            <ActivityIndicator size="large" color="#339914" />
          ) : (
            <TouchableOpacity style={styles.fazerPedidoBtn} activeOpacity={0.8} onPress={() => h.handleCreateOrder(navigation)}>
              <FazerPedidoTxt width={162} height={25} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={styles.tabBarOuter}>
        <View style={[styles.tabBarInner, { backgroundColor: h.isDarkMode ? '#000000' : '#E3E4EB' }]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Menu' })}>
            <View style={h.isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBg}>
              {h.isDarkMode ? <HomeIcon8Dark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <HomeIcon8 width={32} height={32} />}
            </View>
            {h.isDarkMode ? <MenuLabel8 width={33} height={9} fill="#FFFFFF" stroke="#FFFFFF" /> : <MenuLabel8 width={33} height={9} />}
          </TouchableOpacity>

          <View style={[styles.tabSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          {h.deliveryActive && (
            <>
              <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Mapa' })}>
                <View style={h.isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBg}>
                  {h.isDarkMode ? <MapIcon8Dark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <MapIcon8 width={32} height={32} />}
                </View>
                {h.isDarkMode ? <MapaLabel8 width={32} height={12} fill="#FFFFFF" stroke="#FFFFFF" /> : <MapaLabel8 width={32} height={12} />}
              </TouchableOpacity>
              <View style={[styles.tabSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />
            </>
          )}

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Carrinho' })}>
            <View style={h.isDarkMode ? { backgroundColor: '#FFFFFF', width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : [styles.iconBg, { backgroundColor: '#E3DAD9', borderWidth: 1.5, borderColor: '#8A7268' }]}>
              {h.isDarkMode ? <CartIcon8Dark width={32} height={32} fill="#FFD700" stroke="#FFD700" /> : <CartIcon8 width={32} height={32} />}
            </View>
            {h.isDarkMode ? <CarrinhoLabel8 width={52} height={10} fill="#FFD700" stroke="#FFD700" /> : <CarrinhoLabel8 width={52} height={10} />}
          </TouchableOpacity>

          <View style={[styles.tabSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Opções' })}>
            <View style={h.isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBg}>
              {h.isDarkMode ? <GearIcon8Dark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <GearIcon8 width={32} height={32} />}
            </View>
            {h.isDarkMode ? <OpcoesLabel8 width={42} height={12} fill="#FFFFFF" stroke="#FFFFFF" /> : <OpcoesLabel8 width={42} height={12} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
