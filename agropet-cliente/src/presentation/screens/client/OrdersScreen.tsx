import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, ActivityIndicator, Image, Modal, Alert } from 'react-native';
import { useUserMenu } from '../../contexts/UserMenuContext';
import { AuthContext } from '../../contexts/AuthContext';
import { CatalogHeader } from '../../components/CatalogHeader';
import { supabase } from '../../../data/datasources/supabase/client';
import { useTheme } from '../../contexts/ThemeContext';
import { Feather, Ionicons } from '@expo/vector-icons';

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
  const { isDarkMode, colors } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [activeCancelDropdownId, setActiveCancelDropdownId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [showDeliveryOnly, setShowDeliveryOnly] = useState(false);
  const [showHistoryOnly, setShowHistoryOnly] = useState(false);

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

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
        .select('*, order_items( product_id, quantity, unit_price, products( name, image_url, description ) )')
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
      case 'cartao_credito': return <Text style={[styles.pgtoText, { color: '#FF0000' }]}>Cartão/{"\n"}Crédito</Text>;
      case 'cartao_debito': return <Text style={[styles.pgtoText, { color: '#2A7420' }]}>Cartão/{"\n"}Débito</Text>;
      case 'dinheiro': return <Text style={[styles.pgtoText, { color: isDarkMode ? '#81C784' : '#164610' }]}>Dinheiro</Text>;
      default: return <Text style={styles.pgtoText}>{paymentMethod}</Text>;
    }
  };

  const toggleDropdown = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('delivery_active')
        .maybeSingle();

      if (data && !error && data.delivery_active === false) {
        Alert.alert(
          'Rastreamento Desativado',
          'Não é possível Rastrear o pedido no momento pois o frete encontra-se inativo'
        );
        return;
      }
    } catch (e) {
      console.log('Error checking delivery active status:', e);
    }

    if (activeDropdownId === orderId) {
      setActiveDropdownId(null);
    } else {
      setActiveDropdownId(orderId);
      setActiveCancelDropdownId(null);
    }
  };

  const toggleCancelDropdown = (orderId: string) => {
    if (activeCancelDropdownId === orderId) {
      setActiveCancelDropdownId(null);
    } else {
      setActiveCancelDropdownId(orderId);
      setActiveDropdownId(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
        
      if (error) throw error;
      
      showAlert('Sucesso', 'Entrega cancelada com sucesso.');
      fetchOrders();
    } catch (error: any) {
      console.error('Erro ao cancelar entrega:', error);
      showAlert('Erro', 'Não foi possível cancelar a entrega.');
    } finally {
      setShowCancelModal(false);
      setCancellingOrderId(null);
    }
  };

  // Separa os pedidos confirmados/pendentes (em entrega) dos concluídos (histórico)
  const activeOrders = orders.filter(op => op.status === 'confirmed' || op.status === 'pending');
  const pastOrders = orders.filter(op => op.status === 'completed'); // Atualizado para 'completed' para coincidir com o DB

  const deliveryItems: any[] = [];
  activeOrders.forEach(order => {
    if (order.order_items) {
      order.order_items.forEach((item: any) => {
        deliveryItems.push({
          orderId: order.id,
          productId: item.product_id,
          name: item.products?.name || 'Produto',
          imageUrl: item.products?.image_url,
        });
      });
    }
  });

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      
      {/* ========== HEADER ========== */}
      {/* Header Unificado */}
      <CatalogHeader 
        title="Histórico de Pedidos"
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      {/* ========== BODY ========== */}
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, (showDeliveryOnly || showHistoryOnly) && { paddingTop: 10 }]} 
        showsVerticalScrollIndicator={false}
      >
        
        {showDeliveryOnly ? (
          <View style={{ flex: 1, minHeight: 400 }}>
            {/* Botão de Voltar */}
            <TouchableOpacity 
              onPress={() => setShowDeliveryOnly(false)} 
              style={styles.voltarBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="caret-back" size={16} color={isDarkMode ? '#FFE082' : '#1C2434'} style={{ marginRight: 4 }} />
              <Text style={[styles.voltarText, { color: isDarkMode ? '#FFE082' : '#1C2434' }]}>
                Voltar
              </Text>
            </TouchableOpacity>

            <View style={{ marginBottom: 20 }}>
              {isDarkMode ? (
                <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Pedidos em entrega</Text>
              ) : (
                <PedidosEmEntregaSvg width={180} height={20} />
              )}
            </View>

            {/* Lista de Pedidos em Entrega (cards completos) */}
            {activeOrders.length === 0 ? (
              <Text style={[styles.emptyText, { color: isDarkMode ? '#A8A8B3' : '#000000' }]}>
                Não há pedidos em entrega no momento.
              </Text>
            ) : (
              activeOrders.map(order => {
                const firstItem = order.order_items?.[0];
                const imageUrl = firstItem?.products?.image_url;

                return (
                  <View key={order.id} style={[styles.orderCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB', zIndex: (activeDropdownId === order.id || activeCancelDropdownId === order.id) ? 9999 : 10 }]}>
                    <View style={styles.photoCol}>
                      <View style={styles.photoBox}>
                        {imageUrl ? (
                          <Image source={{ uri: imageUrl }} style={styles.productImage} />
                        ) : (
                          <View style={styles.placeholderImg} />
                        )}
                      </View>
                    </View>
                    <View style={styles.numCol}>
                      {isDarkMode ? (
                        <Text style={[styles.cardTitleText, { color: '#FFFFFF', marginBottom: 15 }]}>Nº do pedido</Text>
                      ) : (
                        <NumPedidoSvg width={68} height={12} style={{ marginBottom: 15 }} />
                      )}
                      <Text style={[styles.orderIdText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{order.id.slice(0, 8).toUpperCase()}</Text>
                    </View>
                    <View style={styles.pgtoCol}>
                      <Text style={[styles.cardTitleText, { color: isDarkMode ? '#FFFFFF' : '#1C2434', marginBottom: 10, fontSize: 14.5 }]}>Forma de pagamento</Text>
                      {getPaymentDisplay(order.payment_method)}
                    </View>
                    <View style={styles.actionCol}>
                      <TouchableOpacity onPress={() => toggleDropdown(order.id)}>
                        <RastrearSvg width={57} height={14} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => navigation.navigate('OrderDetailScreen', { order })} style={{ marginTop: 6 }}>
                        <Text style={{ color: isDarkMode ? '#FFE082' : '#1C2434', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>Detalhes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => toggleCancelDropdown(order.id)} style={{ marginTop: 6 }}>
                        <Text style={{ color: isDarkMode ? '#FF8A80' : '#D32F2F', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>Cancelar</Text>
                      </TouchableOpacity>
                      {activeDropdownId === order.id && (
                        <View style={[styles.dropdownBox, { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB', borderColor: isDarkMode ? '#3E3E4A' : '#CCC' }]}>
                          <TouchableOpacity style={styles.dropItemBtn} onPress={() => { setActiveDropdownId(null); navigation.navigate('ClientTabs', { screen: 'Mapa', params: { trackingOrderId: order.id } }); }}>
                            {isDarkMode ? <Text style={styles.dropText}>Ver pelo mapa</Text> : <DropMapa width={83} height={10} />}
                          </TouchableOpacity>
                          <View style={[styles.dropSeparator, { backgroundColor: isDarkMode ? '#3E3E4A' : '#CCC' }]} />
                          <TouchableOpacity style={styles.dropItemBtn} onPress={() => { setActiveDropdownId(null); navigation.navigate('TrackingScreen'); }}>
                            {isDarkMode ? <Text style={styles.dropText}>Ver pela situação</Text> : <DropSitua width={93} height={12} />}
                          </TouchableOpacity>
                        </View>
                      )}
                      {activeCancelDropdownId === order.id && (
                        <View style={[styles.dropdownBox, { top: 95, backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB', borderColor: isDarkMode ? '#3E3E4A' : '#CCC' }]}>
                          <TouchableOpacity style={styles.dropItemBtn} onPress={() => { setActiveCancelDropdownId(null); setCancellingOrderId(order.id); setShowCancelModal(true); }}>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: isDarkMode ? '#FF8A80' : '#D32F2F', textAlign: 'center' }}>Cancelar</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    <View style={[styles.separatorLines, { left: 105, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />
                    <View style={[styles.separatorLines, { left: 185, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />
                    <View style={[styles.separatorLines, { left: 290, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />
                  </View>
                );
              })
            )}
          </View>
        ) : showHistoryOnly ? (
          <View style={{ flex: 1, minHeight: 400 }}>
            {/* Botão de Voltar */}
            <TouchableOpacity 
              onPress={() => setShowHistoryOnly(false)} 
              style={styles.voltarBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="caret-back" size={16} color={isDarkMode ? '#FFE082' : '#1C2434'} style={{ marginRight: 4 }} />
              <Text style={[styles.voltarText, { color: isDarkMode ? '#FFE082' : '#1C2434' }]}>
                Voltar
              </Text>
            </TouchableOpacity>

            <View style={{ marginBottom: 20 }}>
              {isDarkMode ? (
                <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Histórico de compras</Text>
              ) : (
                <HistoricoDeComprasSvg width={180} height={20} />
              )}
            </View>

            {/* Lista do Histórico de Compras (cards completos) */}
            {pastOrders.length === 0 ? (
              <Text style={[styles.emptyText, { color: isDarkMode ? '#A8A8B3' : '#000000' }]}>
                Você não fez nenhuma compra ainda!
              </Text>
            ) : (
              pastOrders.map(order => {
                const firstItem = order.order_items?.[0];
                const imageUrl = firstItem?.products?.image_url;

                return (
                  <View key={order.id} style={[styles.orderCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
                    <View style={styles.photoCol}>
                      <View style={styles.photoBox}>
                        {imageUrl ? (
                          <Image source={{ uri: imageUrl }} style={styles.productImage} />
                        ) : (
                          <View style={styles.placeholderImg} />
                        )}
                      </View>
                    </View>
                    <View style={styles.numCol}>
                      {isDarkMode ? (
                        <Text style={[styles.cardTitleText, { color: '#FFFFFF', marginBottom: 15 }]}>Nº do pedido</Text>
                      ) : (
                        <NumPedidoSvg width={68} height={12} style={{ marginBottom: 15 }} />
                      )}
                      <Text style={[styles.orderIdText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{order.id.slice(0, 8).toUpperCase()}</Text>
                    </View>
                    <View style={styles.pgtoCol}>
                      <Text style={[styles.cardTitleText, { color: isDarkMode ? '#FFFFFF' : '#1C2434', marginBottom: 10, fontSize: 14.5 }]}>Forma de pagamento</Text>
                      {getPaymentDisplay(order.payment_method)}
                    </View>
                    <View style={styles.actionCol}>
                      <Text style={[styles.cardTitleText, { color: '#66BB6A', marginBottom: 15, fontSize: 13, textAlign: 'center' }]}>Pedido concluído</Text>
                      <TouchableOpacity onPress={() => navigation.navigate('OrderDetailScreen', { order })}>
                        <Text style={{ color: isDarkMode ? '#FFE082' : '#1C2434', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>Detalhes</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.separatorLines, { left: 105, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />
                    <View style={[styles.separatorLines, { left: 185, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />
                    <View style={[styles.separatorLines, { left: 290, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <>
            {/* Sessão Em Entrega */}
            <View style={styles.sectionHeader}>
              {isDarkMode ? (
                <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Pedidos em entrega</Text>
              ) : (
                <PedidosEmEntregaSvg width={180} height={20} />
              )}
              <TouchableOpacity onPress={() => setShowDeliveryOnly(true)}>
                {isDarkMode ? (
                  <Text style={[styles.verTudoText, { color: '#FFE082' }]}>Ver tudo</Text>
                ) : (
                  <VerTudoSvg width={60} height={12} />
                )}
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#339914" style={{ marginTop: 20 }} />
            ) : activeOrders.length === 0 ? (
              <Text style={[styles.emptyText, { color: isDarkMode ? '#A8A8B3' : '#000000' }]}>Não há pedidos em entrega.</Text>
            ) : (
              activeOrders.map(order => {
                 const firstItem = order.order_items?.[0];
                 const imageUrl = firstItem?.products?.image_url;

                 return (
                  <View key={order.id} style={[styles.orderCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB', zIndex: (activeDropdownId === order.id || activeCancelDropdownId === order.id) ? 9999 : 10 }]}>
                    
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
                      {isDarkMode ? (
                        <Text style={[styles.cardTitleText, { color: '#FFFFFF', marginBottom: 15 }]}>Nº do pedido</Text>
                      ) : (
                        <NumPedidoSvg width={68} height={12} style={{ marginBottom: 15 }} />
                      )}
                      <Text style={[styles.orderIdText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{order.id.slice(0, 8).toUpperCase()}</Text>
                    </View>

                    {/* Coluna 3: Forma de pagamento */}
                    <View style={styles.pgtoCol}>
                      <Text style={[
                        styles.cardTitleText, 
                        { 
                          color: isDarkMode ? '#FFFFFF' : '#1C2434', 
                          marginBottom: 10, 
                          fontSize: 14.5 
                        }
                      ]}>
                        Forma de pagamento
                      </Text>
                      {getPaymentDisplay(order.payment_method)}
                    </View>

                    {/* Coluna 4: Rastrear / Detalhes / Cancelar */}
                    <View style={styles.actionCol}>
                      <TouchableOpacity onPress={() => toggleDropdown(order.id)}>
                        <RastrearSvg width={57} height={14} />
                      </TouchableOpacity>

                      <TouchableOpacity 
                        onPress={() => navigation.navigate('OrderDetailScreen', { order })} 
                        style={{ marginTop: 6 }}
                      >
                        <Text style={{ 
                          color: isDarkMode ? '#FFE082' : '#1C2434', 
                          fontSize: 12, 
                          fontWeight: 'bold',
                          textAlign: 'center'
                        }}>
                          Detalhes
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        onPress={() => toggleCancelDropdown(order.id)} 
                        style={{ marginTop: 6 }}
                      >
                        <Text style={{ 
                          color: isDarkMode ? '#FF8A80' : '#D32F2F', 
                          fontSize: 12, 
                          fontWeight: 'bold',
                          textAlign: 'center'
                        }}>
                          Cancelar
                        </Text>
                      </TouchableOpacity>

                      {/* Absolute Dropdown do rastreio */}
                      {activeDropdownId === order.id && (
                         <View style={[styles.dropdownBox, { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB', borderColor: isDarkMode ? '#3E3E4A' : '#CCC' }]}>
                            <TouchableOpacity style={styles.dropItemBtn} onPress={() => {
                              setActiveDropdownId(null);
                              navigation.navigate('ClientTabs', { 
                                screen: 'Mapa', 
                                params: { trackingOrderId: order.id } 
                              });
                            }}>
                              {isDarkMode ? (
                                <Text style={styles.dropText}>Ver pelo mapa</Text>
                              ) : (
                                <DropMapa width={83} height={10} />
                              )}
                            </TouchableOpacity>
                            
                            <View style={[styles.dropSeparator, { backgroundColor: isDarkMode ? '#3E3E4A' : '#CCC' }]} />

                            <TouchableOpacity style={styles.dropItemBtn} onPress={() => {
                              setActiveDropdownId(null);
                              navigation.navigate('TrackingScreen');
                            }}>
                              {isDarkMode ? (
                                <Text style={styles.dropText}>Ver pela situação</Text>
                              ) : (
                                <DropSitua width={93} height={12} />
                              )}
                            </TouchableOpacity>
                         </View>
                      )}

                      {/* Absolute Dropdown do cancelamento */}
                      {activeCancelDropdownId === order.id && (
                         <View style={[styles.dropdownBox, { top: 95, backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB', borderColor: isDarkMode ? '#3E3E4A' : '#CCC' }]}>
                            <TouchableOpacity 
                              style={styles.dropItemBtn} 
                              onPress={() => {
                                setActiveCancelDropdownId(null);
                                setCancellingOrderId(order.id);
                                setShowCancelModal(true);
                              }}
                            >
                              <Text style={{ 
                                fontSize: 11, 
                                fontWeight: 'bold', 
                                color: isDarkMode ? '#FF8A80' : '#D32F2F', 
                                textAlign: 'center' 
                              }}>
                                Cancelar
                              </Text>
                            </TouchableOpacity>
                         </View>
                      )}
                    </View>
                    
                    {/* Divisores Visuais */}
                    <View style={[styles.separatorLines, { left: 105, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />
                    <View style={[styles.separatorLines, { left: 185, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />
                    <View style={[styles.separatorLines, { left: 290, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />

                  </View>
                 )
              })
            )}

            {/* Sessão Histórico */}
            <View style={[styles.sectionHeader, { marginTop: 40 }]}>
              {isDarkMode ? (
                <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Histórico de compras</Text>
              ) : (
                <HistoricoDeComprasSvg width={180} height={20} />
              )}
              <TouchableOpacity onPress={() => setShowHistoryOnly(true)}>
                {isDarkMode ? (
                  <Text style={[styles.verTudoText, { color: '#FFE082' }]}>Ver tudo</Text>
                ) : (
                  <VerTudoSvg width={60} height={12} />
                )}
              </TouchableOpacity>
            </View>

            {pastOrders.length === 0 ? (
              <Text style={[styles.emptyText, { color: isDarkMode ? '#A8A8B3' : '#000000' }]}>Você não fez nenhuma compra ainda!</Text>
            ) : (
              pastOrders.map(order => {
                const firstItem = order.order_items?.[0];
                const imageUrl = firstItem?.products?.image_url;

                return (
                  <View key={order.id} style={[styles.orderCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
                    <View style={styles.photoCol}>
                      <View style={styles.photoBox}>
                        {imageUrl ? (
                          <Image source={{ uri: imageUrl }} style={styles.productImage} />
                        ) : (
                          <View style={styles.placeholderImg} />
                        )}
                      </View>
                    </View>
                    <View style={styles.numCol}>
                      {isDarkMode ? (
                        <Text style={[styles.cardTitleText, { color: '#FFFFFF', marginBottom: 15 }]}>Nº do pedido</Text>
                      ) : (
                        <NumPedidoSvg width={68} height={12} style={{ marginBottom: 15 }} />
                      )}
                      <Text style={[styles.orderIdText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{order.id.slice(0, 8).toUpperCase()}</Text>
                    </View>
                    <View style={styles.pgtoCol}>
                      <Text style={[styles.cardTitleText, { color: isDarkMode ? '#FFFFFF' : '#1C2434', marginBottom: 10, fontSize: 14.5 }]}>Forma de pagamento</Text>
                      {getPaymentDisplay(order.payment_method)}
                    </View>
                    <View style={styles.actionCol}>
                      <Text style={[styles.cardTitleText, { color: '#66BB6A', marginBottom: 15, fontSize: 13, textAlign: 'center' }]}>Pedido concluído</Text>
                      <TouchableOpacity onPress={() => navigation.navigate('OrderDetailScreen', { order })}>
                        <Text style={{ color: isDarkMode ? '#FFE082' : '#1C2434', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>Detalhes</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.separatorLines, { left: 105, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />
                    <View style={[styles.separatorLines, { left: 185, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />
                    <View style={[styles.separatorLines, { left: 290, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />
                  </View>
                );
              })
            )}
          </>
        )}
        
      </ScrollView>

      {/* Modal de Confirmação de Cancelamento (Telinha Branca) */}
      <Modal 
        visible={showCancelModal} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '80%',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            borderWidth: isDarkMode ? 1 : 0,
            borderColor: isDarkMode ? '#2D2D35' : 'transparent',
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: isDarkMode ? '#FFFFFF' : '#1C2434',
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 22
            }}>
              Tem certeza que deseja cancelar esta entrega?
            </Text>
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '100%',
              gap: 12
            }}>
              <TouchableOpacity 
                style={{
                  flex: 1,
                  backgroundColor: isDarkMode ? '#2D2D35' : '#E3E4EB',
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center'
                }}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={{ color: isDarkMode ? '#A8A8B3' : '#767676', fontWeight: 'bold', fontSize: 15 }}>Não</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{
                  flex: 1,
                  backgroundColor: isDarkMode ? '#FF5252' : '#D32F2F',
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center'
                }}
                onPress={async () => {
                  if (cancellingOrderId) {
                    await handleCancelOrder(cancellingOrderId);
                  }
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>Sim, cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Alerta Customizado (Sucesso/Erro) */}
      <Modal 
        visible={alertVisible} 
        transparent={true} 
        animationType="fade"
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '80%',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            borderWidth: isDarkMode ? 1 : 0,
            borderColor: isDarkMode ? '#2D2D35' : 'transparent',
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: isDarkMode ? '#FFFFFF' : '#1C2434',
              textAlign: 'center',
              marginBottom: 10
            }}>
              {alertTitle}
            </Text>
            
            <Text style={{
              fontSize: 15,
              color: isDarkMode ? '#FFFFFF' : '#555555',
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 20
            }}>
              {alertMessage}
            </Text>
            
            <TouchableOpacity 
              style={{
                width: '60%',
                backgroundColor: '#2196F3', // Azul
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center'
              }}
              onPress={() => setAlertVisible(false)}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========== BARRA INFERIOR (Tudo Inativo) ========== */}
      <View style={styles.tabBarOuter}>
        <View style={[styles.tabBarInner, { backgroundColor: isDarkMode ? '#000000' : '#E3E4EB' }]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Menu' })}>
            <View style={isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBgInactive}>
              {isDarkMode ? (
                <HomeIcon8 width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" />
              ) : (
                <HomeIcon8 width={32} height={32} />
              )}
            </View>
            {isDarkMode ? (
              <MenuLabel8 width={33} height={9} fill="#FFFFFF" stroke="#FFFFFF" />
            ) : (
              <MenuLabel8 width={33} height={9} />
            )}
          </TouchableOpacity>
          
          <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Mapa' })}>
            <View style={isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBgInactive}>
              {isDarkMode ? (
                <MapIcon8 width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" />
              ) : (
                <MapIcon8 width={32} height={32} />
              )}
            </View>
            {isDarkMode ? (
              <MapaLabel8 width={32} height={12} fill="#FFFFFF" stroke="#FFFFFF" />
            ) : (
              <MapaLabel8 width={32} height={12} />
            )}
          </TouchableOpacity>
          
          <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Carrinho' })}>
            <View style={isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBgInactive}>
              {isDarkMode ? (
                <CartIcon8 width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" />
              ) : (
                <CartIcon8 width={32} height={32} />
              )}
            </View>
            {isDarkMode ? (
              <CarrinhoLabel8 width={52} height={10} fill="#FFFFFF" stroke="#FFFFFF" />
            ) : (
              <CarrinhoLabel8 width={52} height={10} />
            )}
          </TouchableOpacity>

          <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Opções' })}>
            <View style={isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBgInactive}>
              {isDarkMode ? (
                <GearIcon8 width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" />
              ) : (
                <GearIcon8 width={32} height={32} />
              )}
            </View>
            {isDarkMode ? (
              <OpcoesLabel8 width={42} height={12} fill="#FFFFFF" stroke="#FFFFFF" />
            ) : (
              <OpcoesLabel8 width={42} height={12} />
            )}
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
    width: 105,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  photoBox: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  placeholderImg: {
    width: 70,
    height: 70,
    backgroundColor: '#EAEAEA',
  },
  numCol: {
    width: 80,
    alignItems: 'center',
    paddingTop: 15,
  },
  orderIdText: {
    fontSize: 12,
    color: '#000000',
  },
  pgtoCol: {
    width: 105,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  verTudoText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTitleText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dropText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  voltarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  voltarText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
