import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  Text,
} from 'react-native';
import { useUserMenu } from '../contexts/UserMenuContext';

import MenuInicialTitle from '../assets/tela2/header/Menu inicial.svg';
import OpcoesTitle from '../assets/tela4/parte superior/Opções.svg';
import VerPedidosTitle from '../assets/tela5/parte superior/Ver pedidos.svg';
import HistoricoVendasTitle from '../assets/tela6/parte superior/Histórico de vendas.svg';
import GerenciarProdutosTitle from '../assets/tela7/parte superior/Adicionar/Remover/Gerenciar produtos.svg';
import RegistrarProdutoTitle from '../assets/tela8/parte superior/Registrar produto.svg';
import BarraPesquisaSVG from '../assets/tela7/parte superior/Adicionar/Remover/Barra de Pesquisa.svg';
import PersonIcon from '../assets/tela2/header/Person Icon.svg';
import AdmIcon from '../assets/tela2/header/Adm.svg';

// SVGs Admin Tela 2
import MiniLogo from '../assets/tela2/header/Mini Logo.svg';

interface AdminHeaderProps {
  title?: 'home' | 'mapa' | 'gerenciar' | 'opcoes' | 'ver_pedidos' | 'historico_vendas' | 'registrar_produto';
  searchValue?: string;
  onSearchChange?: (text: string) => void;
}

export default function AdminHeader({ title = 'home', searchValue, onSearchChange }: AdminHeaderProps) {
  const { toggleMenu } = useUserMenu();

  return (
    <View style={styles.headerContainer}>
      {/* Mini Logo */}
      <MiniLogo width={36} height={36} />

      {/* Title - Left aligned next to MiniLogo */}
      <View style={[styles.titleWrapper, { marginLeft: 8 }]}>
        {title === 'home' && <MenuInicialTitle width={120} height={20} />}
        {title === 'mapa' && <Text style={styles.textTitle}>Localizar entrega</Text>}
        {title === 'opcoes' && <OpcoesTitle width={80} height={20} />}
        {title === 'ver_pedidos' && <VerPedidosTitle width={110} height={20} />}
        {title === 'historico_vendas' && <HistoricoVendasTitle width={105} height={40} />}
        {title === 'gerenciar' && <GerenciarProdutosTitle width={80} height={38} />}
        {title === 'registrar_produto' && <RegistrarProdutoTitle width={80} height={38} />}
      </View>

      {/* Right side: Adm text or Search Bar + Person Icon */}
      <View style={styles.rightGroup}>
        {(title === 'gerenciar' || title === 'registrar_produto') ? (
          <View style={styles.searchBarContainer}>
            {/* SVG as background - shows magnifying glass + placeholder text */}
            <BarraPesquisaSVG 
              width={165} 
              height={36} 
              style={{ position: 'absolute', left: 0, top: 0 }} 
            />
            {/* Invisible TextInput on top - no placeholder since SVG already has it */}
            {/* When user types, the text overlays the SVG placeholder */}
            <TextInput 
              style={styles.searchInput}
              value={searchValue}
              onChangeText={onSearchChange}
              placeholderTextColor="transparent"
            />
          </View>
        ) : (
          <AdmIcon width={45} height={25} style={{ marginRight: 8 }} />
        )}
        <TouchableOpacity 
          onPress={toggleMenu} 
          activeOpacity={0.7}
          style={styles.personCircle}
        >
          <PersonIcon width={46} height={46} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C2434',
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'android' ? 38 : 50,
    paddingBottom: 10,
    gap: 6,
  },
  titleWrapper: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  textTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  personCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  rightGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  searchBarContainer: {
    width: 165,
    height: 36,
    marginRight: 8,
    justifyContent: 'center',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    height: 36,
    paddingLeft: 30,
    paddingRight: 10,
    paddingVertical: 0,
    fontSize: 13,
    color: '#333',
    backgroundColor: 'transparent',
  },
});
