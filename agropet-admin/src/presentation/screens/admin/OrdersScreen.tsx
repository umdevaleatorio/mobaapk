import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { supabase } from '../../../data/datasources/supabase/client';

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    // Realiza um 'Join' brutal passando por 3 Tabelas para pegar Tudo
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, status, total, payment_method, created_at,
        users ( name, email ),
        order_items ( quantity, unit_price, products ( name ) )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Erro ao carregar pedidos', error.message);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders();
    });
    return unsubscribe;
  }, [navigation]);

  const renderItem = ({ item }: any) => {
    // Formata a data bonitinha
    const orderDate = new Date(item.created_at).toLocaleString('pt-BR');
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.clientName}>{item.users?.name || 'Cliente Sem Nome'}</Text>
          <Text style={styles.date}>{orderDate}</Text>
        </View>

        <Text style={styles.email}>{item.users?.email}</Text>
        
        <View style={styles.separator} />

        {/* Lista de Rações / Itens Comprados */}
        {item.order_items.map((cartItem: any, index: number) => (
          <View key={index} style={styles.itemRow}>
            <Text style={{ flex: 1, color: '#333' }}>{cartItem.quantity}x {cartItem.products?.name}</Text>
            <Text style={{ fontWeight: 'bold' }}>R$ {(cartItem.quantity * cartItem.unit_price).toFixed(2)}</Text>
          </View>
        ))}

        <View style={styles.separator} />

        <View style={styles.footerRow}>
          <Text style={styles.method}>PAGTO: {item.payment_method.toUpperCase()}</Text>
          <Text style={styles.totalText}>Total: R$ {item.total.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : orders.length === 0 ? (
        <Text style={styles.empty}>Nenhum pedido recebido ainda.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 10, paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f1f1' },
  card: { backgroundColor: '#fff', padding: 15, marginHorizontal: 10, marginTop: 15, borderRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clientName: { fontSize: 18, fontWeight: 'bold', color: '#1B2A3B' },
  date: { fontSize: 12, color: 'gray' },
  email: { fontSize: 14, color: '#666', marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  separator: { height: 1, backgroundColor: '#eee', marginVertical: 10 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  method: { fontSize: 12, fontWeight: 'bold', backgroundColor: '#e2e6ef', padding: 5, borderRadius: 4, overflow: 'hidden' },
  totalText: { fontSize: 18, fontWeight: 'bold', color: 'darkgreen' },
  empty: { textAlign: 'center', marginTop: 50, color: 'gray' }
});
