import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import Colors from '../../theme/colors';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

// SVGs Admin Tela 2
import BemVindoAdm from '../../assets/tela2/BemVindoAdm.svg';
import GerenciarTitle from '../../assets/tela2/GerenciarTitle.svg';
import FundoPainel from '../../assets/tela2/cards/FundoPainel.svg';
import PainelVendasText from '../../assets/tela2/cards/PainelVendas.svg';
import FundoHistorico from '../../assets/tela2/cards/FundoHistorico.svg';
import HistoricoVendasText from '../../assets/tela2/cards/HistoricoVendas.svg';
import FundoPedidos from '../../assets/tela2/dropdown/FundoPedidos.svg';
import VerPedidosText from '../../assets/tela2/dropdown/VerPedidos.svg';
import FundoSair from '../../assets/tela2/dropdown/FundoSair.svg';
import SairBtn from '../../assets/tela2/dropdown/Sair.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AdminHomeScreen() {
  const { signOut } = React.useContext(AuthContext);
  const navigation = useNavigation<any>();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Erro ao sair:", e);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#1C2434" barStyle="light-content" />
      <AdminHeader />
      
      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Message */}
        <View style={styles.welcomeWrapper}>
          <BemVindoAdm width={SCREEN_WIDTH * 0.85} height={60} />
        </View>

        {/* Gerenciar Section Title */}
        <View style={styles.sectionTitleWrapper}>
          <GerenciarTitle width={135} height={30} />
        </View>

        {/* Sales Panel Card */}
        <TouchableOpacity 
          style={styles.cardButton} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AdminOrdersScreen')}
        >
          <View style={styles.cardStack}>
            <FundoPainel width={SCREEN_WIDTH * 0.85} height={115} />
            <View style={styles.cardTextOverlay}>
              <PainelVendasText width={240} height={85} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Sales History Card */}
        <TouchableOpacity 
          style={styles.cardButton} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AdminSalesHistoryScreen')}
        >
          <View style={styles.cardStack}>
            <FundoHistorico width={SCREEN_WIDTH * 0.85} height={115} />
            <View style={styles.cardTextOverlay}>
              <HistoricoVendasText width={260} height={95} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Ver Pedidos Card */}
        <TouchableOpacity 
          style={styles.cardButton} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AdminOrdersScreen')}
        >
          <View style={styles.cardStack}>
            <FundoPedidos width={SCREEN_WIDTH * 0.85} height={115} />
            <View style={styles.cardTextOverlay}>
              <VerPedidosText width={200} height={75} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Logout Button (Red) */}
        <TouchableOpacity 
          style={[styles.cardButton, { marginTop: 5 }]} 
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <View style={styles.cardStack}>
            <FundoSair width={SCREEN_WIDTH * 0.85} height={115} />
            <View style={styles.cardTextOverlay}>
              <SairBtn width={70} height={35} />
            </View>
          </View>
        </TouchableOpacity>
        
        {/* Padding for bottom tab bar if needed, but absolute pos usually covers it */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Global Admin Menu Modal */}
      <AdminUserMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 24,
  },
  welcomeWrapper: {
    marginBottom: 30,
    alignItems: 'center',
  },
  sectionTitleWrapper: {
    alignSelf: 'flex-start',
    marginLeft: '5%',
    marginBottom: 15,
  },
  cardButton: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
