import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator, Image } from 'react-native';
import { useUserMenu } from '../../contexts/UserMenuContext';
import { AuthContext } from '../../contexts/AuthContext';
import { CatalogHeader } from '../../components/CatalogHeader';
import { supabase } from '../../../data/datasources/supabase/client';

// Body Labels
import PedidosEmEntregaSvg from '../../assets/tela11/Pedidos em entrega_.svg';
import HistoricoDeComprasSvg from '../../assets/tela11/Histórico de compras_.svg';
import VerTudoSvg from '../../assets/tela11/Ver tudo.svg';

// Card em entrega
import SeparadorCard from '../../assets/tela11/em entrega 1/Separador 1.svg';
import NumPedidoSvg from '../../assets/tela11/em entrega 1/Nº do pedido.svg';
import FormaPgtoSvg from '../../assets/tela11/em entrega 1/Forma de pagamento.svg';
import RastrearSvg from '../../assets/tela11/em entrega 1/Rastrear.svg';
import PixSvg from '../../assets/tela11/em entrega 1/PIX.svg'; 
// OBS: Para outras formas de pagamento, renderizaremos o texto colorido.

// Dropdown Rastreio
import DropMapa from '../../assets/tela11/em entrega 1/selecionar rastreio/Ver pelo mapa.svg';
import DropSitua from '../../assets/tela11/em entrega 1/selecionar rastreio/Ver pela situação.svg';

// Barra Inferior (Todos inativos, copiados da Tela 11)
import HomeIcon8 from '../../assets/tela11/barra de baixo/Home.svg';
import MapIcon8 from '../../assets/tela11/barra de baixo/Map.svg';
import CartIcon8 from '../../assets/tela11/barra de baixo/Cart.svg';
import GearIcon8 from '../../assets/tela11/barra de baixo/Gear.svg';
import MenuLabel8 from '../../assets/tela11/barra de baixo/Menu.svg';
import MapaLabel8 from '../../assets/tela11/barra de baixo/Mapa.svg';
import CarrinhoLabel8 from '../../assets/tela11/barra de baixo/Carrinho.svg';
import OpcoesLabel8 from '../../assets/tela11/barra de baixo/Opções.svg';

export default function OrdersScreen({ navigation }: any) {
  const { toggleMenu } = useUserMenu();
  const { user } = useContext(AuthContext);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Busca todos os pedidos do usuário ordenados por data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items( product_id, products( name, image_url ) )')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentDisplay = (paymentMethod: string) => {
    switch(paymentMethod) {
      case 'pix': return <PixSvg width={30} height={13} />;
      case 'cartao_credito': return <Text style={[styles.pgtoText, { color: '#FF0000' }]}>Cartão/{'\n'}Crédito</Text>;
      case 'cartao_debito': return <Text style={[styles.pgtoText, { color: '#2A7420' }]}>Cartão/{'\n'}Débito</Text>;
      case 'dinheiro': return <Text style={[styles.pgtoText, { color: '#042A7D' }]}>Dinheiro</Text>;
      default: return <Text style={styles.pgtoText}>{paymentMethod}</Text>;
    }
  };

  const toggleDropdown = (orderId: string) => {
    if (activeDropdownId === orderId) {
      setActiveDropdownId(null);
    } else {
      setActiveDropdownId(orderId);
    }
  };

  // Separa os pedidos confirmados/pendentes (em entrega) dos concluídos (histórico)
  const activeOrders = orders.filter(op => op.status === 'confirmed' || op.status === 'pending');
  const pastOrders = orders.filter(op => op.status === 'delivered'); // Por enquanto sempre vazio se não houver

  return (
    <View style={styles.mainContainer}>
      
      {/* ========== HEADER ========== */}
      {/* Header Unificado */}
      <CatalogHeader 
        title="Histórico de Pedidos"
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      {/* ========== BODY ========== */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Sessão Em Entrega */}
        <View style={styles.sectionHeader}>
          <PedidosEmEntregaSvg width={180} height={20} />
          <TouchableOpacity>
            <VerTudoSvg width={60} height={12} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#339914" style={{ marginTop: 20 }} />
        ) : activeOrders.length === 0 ? (
          <Text style={styles.emptyText}>Não há pedidos em entrega.</Text>
        ) : (
          activeOrders.map(order => {
             // Pegar a imagem do primeiro produto (se existir)
             const firstItem = order.order_items?.[0];
             const imageUrl = firstItem?.products?.image_url;

             return (
              <View key={order.id} style={[styles.orderCard, { zIndex: activeDropdownId === order.id ? 9999 : 10 }]}>
                
                {/* Coluna 1: Foto */}
                <View style={styles.photoCol}>
                  <View style={styles.photoBox}>
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.productImage} />
                    ) : (
                      <View style={styles.placeholderImg} />
                    )}
                  </View>
                </View>

                {/* Coluna 2: Número do Pedido */}
                <View style={styles.numCol}>
                  <NumPedidoSvg width={68} height={12} style={{ marginBottom: 15 }} />
                  <Text style={styles.orderIdText}>{order.id.slice(0, 8).toUpperCase()}</Text>
                </View>

                {/* Coluna 3: Forma de pagamento */}
                <View style={styles.pgtoCol}>
                  <FormaPgtoSvg width={63} height={20} style={{ marginBottom: 10 }} />
                  {getPaymentDisplay(order.payment_method)}
                </View>

                {/* Coluna 4: Rastrear / Dropdown */}
                <View style={styles.actionCol}>
                  <TouchableOpacity onPress={() => toggleDropdown(order.id)}>
                    <RastrearSvg width={57} height={14} />
                  </TouchableOpacity>

                  {/* Absolute Dropdown do rastreio */}
                  {activeDropdownId === order.id && (
                     <View style={styles.dropdownBox}>
                        <TouchableOpacity style={styles.dropItemBtn} onPress={() => {
                          setActiveDropdownId(null);
                          navigation.navigate('ClientTabs', { screen: 'Mapa' });
                        }}>
                          <DropMapa width={83} height={10} />
                        </TouchableOpacity>
                        
                        <View style={styles.dropSeparator} />

                        <TouchableOpacity style={styles.dropItemBtn} onPress={() => {
                          setActiveDropdownId(null);
                          navigation.navigate('TrackingScreen');
                        }}>
                          <DropSitua width={93} height={12} />
                        </TouchableOpacity>
                     </View>
                  )}
                </View>
                
                {/* Divisores Visuais */}
                <View style={[styles.separatorLines, { left: 85 }]} />
                <View style={[styles.separatorLines, { left: 180 }]} />
                <View style={[styles.separatorLines, { left: 260 }]} />

              </View>
             )
          })
        )}

        {/* Sessão Histórico */}
        <View style={[styles.sectionHeader, { marginTop: 40 }]}>
          <HistoricoDeComprasSvg width={180} height={20} />
          <TouchableOpacity>
            <VerTudoSvg width={60} height={12} />
          </TouchableOpacity>
        </View>

        {pastOrders.length === 0 ? (
          <Text style={styles.emptyText}>Você não fez nenhuma compra ainda!</Text>
        ) : (
          <Text style={styles.emptyText}>Exibindo histórico...</Text> // Placeholder futuro
        )}
        
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#000000',
    marginTop: 10,
    marginBottom: 20,
  },

  // ========== CARD EM ENTREGA ==========
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#E3E4EB',
    borderRadius: 15,
    marginBottom: 20,
    minHeight: 100,
    position: 'relative',
    overflow: 'visible', // Permitir que o dropdown vaze
    zIndex: 10,
  },
  photoCol: {
    width: 85,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  photoBox: {
    width: 60,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  placeholderImg: {
    width: 50,
    height: 50,
    backgroundColor: '#EAEAEA',
  },
  numCol: {
    width: 95,
    alignItems: 'center',
    paddingTop: 15,
  },
  orderIdText: {
    fontSize: 12,
    color: '#000000',
  },
  pgtoCol: {
    width: 80,
    alignItems: 'center',
    paddingTop: 15,
  },
  pgtoText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 999,
  },
  
  // Linhas separadoras brancas do card
  separatorLines: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: '#F5F5F5',
  },

  // Dropdown de Rastreio (Fundo escuro/prata com 2 opções soltas)
  dropdownBox: {
    position: 'absolute',
    top: 70,
    right: 5,
    width: 110,
    backgroundColor: '#E3E4EB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 2000,
  },
  dropItemBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  dropSeparator: {
    height: 1,
    backgroundColor: '#CCC',
    marginHorizontal: 5,
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
