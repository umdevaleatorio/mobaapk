import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity, TextInput, StatusBar, Image, Platform } from 'react-native';
import { useUserMenu } from '../../contexts/UserMenuContext';
import { supabase } from '../../../data/datasources/supabase/client';
import { CartContext } from '../../contexts/CartContext';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

import { CatalogHeader } from '../../components/CatalogHeader';
import { Feather } from '@expo/vector-icons';

// === IMPORTAÇÃO DOS SVGs (assets/tela9) ===
// Superior
// Removidos MiniLogo, CheckoutTitle, PersonIcon e Lupa (usados no CatalogHeader)

// Resumo
import ResumoTitle from '../../assets/tela9/Resumo do pedido_.svg';
import ProdutoHdr from '../../assets/tela9/resumo/Produto.svg';
import QuantidadeHdr from '../../assets/tela9/resumo/Quantidade.svg';
import PrecoHdr from '../../assets/tela9/resumo/Preço.svg';
import TotalPedido from '../../assets/tela9/resumo/Total do pedido_.svg';

// Pagamento
import FormaPagamentoTitle from '../../assets/tela9/Forma de pagamento_.svg';
import PixTxt from '../../assets/tela9/pagamento/PIX.svg';
import UpsideDown from '../../assets/tela9/pagamento/Upside Down.svg';
import InstructionTxt from '../../assets/tela9/pagamento/Escolha a forma de pagamento e clique em fazer pedido em seguida!.svg';
import FazerPedidoTxt from '../../assets/tela9/pagamento/Fazer Pedido!.svg';

// Barra Inferior (Tela 8/9 Carrinho ativo)
import HomeIcon8 from '../../assets/tela8/barra/Home.svg';
import MapIcon8 from '../../assets/tela8/barra/Map.svg';
import CartIcon8 from '../../assets/tela8/barra/Cart.svg';
import GearIcon8 from '../../assets/tela8/barra/Gear.svg';
import MenuLabel8 from '../../assets/tela8/barra/MenuLabel.svg';
import MapaLabel8 from '../../assets/tela8/barra/MapaLabel.svg';
import CarrinhoLabel8 from '../../assets/tela8/barra/CarrinhoLabel.svg';
import OpcoesLabel8 from '../../assets/tela8/barra/OpcoesLabel.svg';

export default function PaymentScreen({ navigation }: any) {
  const { toggleMenu } = useUserMenu();
  const { isDarkMode } = useTheme();
  const { cart, total, clearCart, removeFromCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const [searchText, setSearchText] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX'); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deliveryActive, setDeliveryActive] = useState(true);

  // Sincronizar status de frete ativo/inativo na barra inferior
  React.useEffect(() => {
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
        console.log('Error fetching delivery active in payment:', e);
      }
    };

    fetchDeliveryStatus();

    const channel = supabase
      .channel('store_settings_payment_tabs')
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

  const grandTotal = total;

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Erro', 'Seu carrinho está vazio.');
      navigation.goBack();
      return;
    }

    // Conversão das strings bonitinhas do front pro enum do DB
    const dbPaymentMethod = {
      'PIX': 'pix',
      'Dinheiro': 'dinheiro',
      'Cartão/Crédito': 'cartao_credito',
      'Cartão/Débito': 'cartao_debito'
    }[paymentMethod] || 'pix';

    // Montar itens para a RPC de checkout atômico
    const items = cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price
    }));

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('finalizar_pedido', {
        p_user_id: user?.id,
        p_items: items,
        p_payment_method: dbPaymentMethod,
        p_delivery_type: 'retirada',
        p_delivery_address: '',
        p_needs_change: ''
      });

      if (error) {
        // Tratar erro de estoque insuficiente
        if (error.message && error.message.includes('ESTOQUE_INSUFICIENTE')) {
          try {
            // Parsear detalhes dos produtos sem estoque
            const jsonStr = error.message.split('ESTOQUE_INSUFICIENTE:').pop() || '[]';
            const detalhes = JSON.parse(jsonStr);

            // Montar mensagem amigável
            const msgs = detalhes.map((d: any) =>
              d.available === 0
                ? `• ${d.name}: esgotado`
                : `• ${d.name}: pedido ${d.requested}, disponível ${d.available}`
            );

            // Remover automaticamente os produtos sem estoque do carrinho
            for (const d of detalhes) {
              if (d.available === 0) {
                await removeFromCart(d.product_id);
              }
            }

            Alert.alert(
              'Estoque Insuficiente',
              `Alguns produtos não têm estoque suficiente:\n\n${msgs.join('\n')}\n\nOs produtos esgotados foram removidos do carrinho. Ajuste as quantidades e tente novamente.`
            );
          } catch (parseErr) {
            Alert.alert('Estoque Insuficiente', 'Alguns produtos do carrinho não têm estoque suficiente. Verifique e tente novamente.');
          }
          return;
        }

        // Tratar erro de produto não encontrado
        if (error.message && error.message.includes('PRODUTO_NAO_ENCONTRADO')) {
          Alert.alert('Produto Indisponível', 'Um produto do seu carrinho não está mais disponível. Verifique o carrinho e tente novamente.');
          return;
        }

        // Erro genérico do Supabase
        throw error;
      }

      // Sucesso! Limpar carrinho e navegar para confirmação
      const orderId = data.order_id;
      await clearCart();
      navigation.replace('PaymentConfirmScreen', { orderId });

    } catch (err: any) {
      Alert.alert('Erro ao Fazer Pedido', err.message || 'Ocorreu um erro inesperado. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <StatusBar backgroundColor={isDarkMode ? '#121212' : '#1C2434'} barStyle="light-content" />

      {/* Header Unificado */}
      <CatalogHeader 
        title="Checkout"
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        
        {/* ========== RESUMO DO PEDIDO ========== */}
        <View style={styles.sectionHeader}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1C2434' }}>Resumo do pedido</Text>
        </View>

        <View style={[styles.resumoCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#1C2434' }]}>
          {/* Header da Tabela */}
          <View style={[styles.tRow, { borderBottomWidth: 1.5, borderColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
            <View style={styles.tColProduto}><ProdutoHdr width={62} height={15} /></View>
            <View style={[styles.tColDivider, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]} />
            <View style={styles.tColQty}><QuantidadeHdr width={87} height={15} /></View>
            <View style={[styles.tColDivider, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]} />
            <View style={styles.tColPreco}><PrecoHdr width={45} height={15} /></View>
          </View>

          {/* Produtos (Dinâmico) */}
          {cart.map((item, index) => (
            <View key={index} style={[styles.tRow, { borderBottomWidth: 1.5, borderColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
              <View style={styles.tColProduto}>
                <Text style={styles.itemText} numberOfLines={2}>{item.name}</Text>
              </View>
              <View style={[styles.tColDivider, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]} />
              <View style={styles.tColQty}>
                <Text style={styles.itemTextGrande}>{item.quantity}</Text>
              </View>
              <View style={[styles.tColDivider, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]} />
              <View style={styles.tColPreco}>
                <Text style={styles.itemText}>R$ {item.price.toFixed(2)}</Text>
              </View>
            </View>
          ))}

          {/* Footer da Tabela */}
          <View style={styles.tRow}>
            <View style={[styles.tColProduto, { flex: 0, width: '60%', alignItems: 'flex-start', paddingLeft: 16 }]}>
               <TotalPedido width={143} height={17} />
            </View>
            <View style={[styles.tColDivider, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]} />
            <View style={[styles.tColPreco, { flex: 1 }]}>
               <Text style={styles.itemTotal}>R$ {grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* ========== FORMA DE PAGAMENTO ========== */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1C2434' }}>Forma de pagamento</Text>
        </View>

        <View style={[styles.paymentCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
          <TouchableOpacity 
            style={[styles.dropdownBox, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }]} 
            activeOpacity={0.8}
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {paymentMethod === 'PIX' ? (
               <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1C2434' }}>PIX</Text>
            ) : (
               <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1C2434' }}>{paymentMethod}</Text>
            )}
            <Feather name="chevron-down" size={24} color={isDarkMode ? '#FFFFFF' : '#1C2434'} style={{ transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }} />
          </TouchableOpacity>

          {isDropdownOpen && (
            <View style={[styles.dropdownList, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
              <TouchableOpacity style={[styles.dropdownItem, { borderColor: isDarkMode ? '#3E3E4A' : '#F0F0F0' }]} onPress={() => { setPaymentMethod('PIX'); setIsDropdownOpen(false); }}>
                <Text style={[styles.dropdownText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>PIX</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dropdownItem, { borderColor: isDarkMode ? '#3E3E4A' : '#F0F0F0' }]} onPress={() => { setPaymentMethod('Cartão/Débito'); setIsDropdownOpen(false); }}>
                <Text style={[styles.dropdownText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Cartão/Débito</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dropdownItem, { borderColor: isDarkMode ? '#3E3E4A' : '#F0F0F0' }]} onPress={() => { setPaymentMethod('Cartão/Crédito'); setIsDropdownOpen(false); }}>
                <Text style={[styles.dropdownText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Cartão/Crédito</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dropdownItem, { borderColor: isDarkMode ? '#3E3E4A' : '#F0F0F0' }]} onPress={() => { setPaymentMethod('Dinheiro'); setIsDropdownOpen(false); }}>
                <Text style={[styles.dropdownText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Dinheiro</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.instructionBox}>
            <Text style={{ color: isDarkMode ? '#FFFFFF' : '#1C2434', fontSize: 13, fontWeight: 'bold', textAlign: 'center' }}>
              Escolha a forma de pagamento e clique em fazer pedido em seguida!
            </Text>
          </View>

          {loading ? (
             <ActivityIndicator size="large" color="#339914" />
          ) : (
             <TouchableOpacity style={styles.fazerPedidoBtn} activeOpacity={0.8} onPress={handleCreateOrder}>
                <FazerPedidoTxt width={162} height={25} />
             </TouchableOpacity>
          )}
        </View>

      </ScrollView>

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

  // ========== SCROLL / CONTEÚDO ==========
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100, // espaço da barra inferior
  },
  sectionHeader: {
    marginBottom: 10,
    marginLeft: 4,
  },

  // ========== RESUMO CARD (#1C2434) ==========
  resumoCard: {
    backgroundColor: '#1C2434',
    borderRadius: 20,
    overflow: 'hidden',
  },
  tRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50, // altura base para linhas
  },
  tColDivider: {
    width: 1.5,
    backgroundColor: '#F5F5F5',
    alignSelf: 'stretch', // Estica na altura inteira da linha
  },
  tColProduto: {
    flex: 1.3,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tColQty: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tColPreco: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
  },
  itemTextGrande: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  itemTotal: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },

  // ========== PAYMENT CARD (#E3E4EB) ==========
  paymentCard: {
    backgroundColor: '#E3E4EB',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  dropdownBox: {
    width: 250,
    height: 45,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  instructionBox: {
    marginTop: 20,
    marginBottom: 20,
  },
  dropdownList: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 5,
    paddingVertical: 5,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fazerPedidoBtn: {
    width: 238,
    height: 67,
    backgroundColor: '#339914',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ========== BARRA INFERIOR (Matches ClientTabs) ==========
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
