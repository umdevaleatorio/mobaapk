import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useUserMenu } from '../contexts/UserMenuContext';

// === HEADER SVGs ===
import MiniLogo from '../assets/tela4/header/MiniLogo.svg';
import Lupa from '../assets/tela4/header/Lupa.svg';
import PersonIcon from '../assets/tela4/header/PersonIcon.svg';

// === FILTRO SVGs ===
import FiltroIcon from '../assets/tela4/filtro/FiltroIcon.svg';
import Filtro from '../assets/tela4/filtro/Filtro.svg';
import CategoriaLabel from '../assets/tela4/filtro/Categoria.svg';
import RacaoTag from '../assets/tela4/filtro/Racao.svg';
import PescaTag from '../assets/tela4/filtro/Pesca.svg';
import SementesTag from '../assets/tela4/filtro/Sementes.svg';
import AduboTag from '../assets/tela4/filtro/Adubo.svg';

interface CatalogHeaderProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  title?: string;
}

/**
 * Header + Filtro compartilhado entre as telas.
 * Detecta automaticamente o estado ativo do perfil.
 */
export function CatalogHeader({ searchText, onSearchChange, title = 'Catálogo' }: CatalogHeaderProps) {
  const { toggleMenu } = useUserMenu();
  const route = useRoute();
  
  // Verifica se estamos na tela de perfil para mudar a cor do ícone
  const isProfileActive = route.name === 'ProfileScreen';

  return (
    <>
      {/* ========== PARTE SUPERIOR (#1C2434) ========== */}
      <View style={styles.headerContainer}>
        {/* Mini Logo (36x36) */}
        <MiniLogo width={36} height={36} />

        {/* Título Dinâmico */}
        <Text style={styles.catalogoText}>{title}</Text>

        {/* Barra de busca (#F2F2F2, rx=10) */}
        <View style={styles.searchBar}>
          <Lupa width={26} height={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Procurar produtos..."
            placeholderTextColor="#919191"
            value={searchText}
            onChangeText={onSearchChange}
          />
        </View>

        {/* Person Icon (agora 36x36 para bater com MiniLogo) */}
        <TouchableOpacity 
          style={[
            styles.personCircle, 
            { backgroundColor: isProfileActive ? '#255e27' : 'rgba(255,255,255,0.3)' }
          ]} 
          onPress={toggleMenu} 
          activeOpacity={0.7}
        >
          <PersonIcon width={46} height={46} />
        </TouchableOpacity>
      </View>
    </>
  );
}

interface CatalogFilterProps {
  activeCategory?: string;
}

export function CatalogFilter({ activeCategory }: CatalogFilterProps) {
  return (
    <View style={styles.filterBar}>
      {/* Fundo pill (#E3E4EB, rx=30) para TODA a barra */}
      <View style={styles.filterPill}>
        {/* FiltroIcon + texto */}
        <TouchableOpacity style={styles.filterBtn}>
          <FiltroIcon width={12} height={12} />
          <Filtro width={23} height={9} />
        </TouchableOpacity>

        <View style={styles.filterSep} />

        <CategoriaLabel width={53} height={11} />

        <View style={styles.filterSep} />

        {/* Tags — com destaque no ativo */}
        <View style={activeCategory === 'Ração' ? styles.tagActive : undefined}>
          <RacaoTag width={31} height={11} />
        </View>

        <View style={styles.filterSep} />

        <PescaTag width={30} height={9} />

        <View style={styles.filterSep} />

        <SementesTag width={51} height={9} />

        <View style={styles.filterSep} />

        <AduboTag width={58} height={9} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  catalogoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 36,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ========== FILTRO ==========
  filterBar: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  // Pill shape: #E3E4EB, borderRadius alto em ambos os lados
  filterPill: {
    flexDirection: 'row',
    backgroundColor: '#E3E4EB',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 10,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterSep: {
    width: 1,
    height: 24,
    backgroundColor: '#8A7268',
  },
  // Tag ativa: Fundo.svg 42x20, rx=10, #E3DAD9
  tagActive: {
    backgroundColor: '#E3DAD9',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  maisText: {
    fontSize: 13,
    color: '#8A7268',
    fontWeight: '600',
  },
});
