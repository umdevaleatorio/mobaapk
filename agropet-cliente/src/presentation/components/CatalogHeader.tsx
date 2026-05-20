import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useUserMenu } from '../contexts/UserMenuContext';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useFilter } from '../contexts/FilterContext';
import { Feather } from '@expo/vector-icons';

// === HEADER SVGs ===
import MiniLogo from '../assets/tela4/header/MiniLogo.svg';
import Lupa from '../assets/tela4/header/Lupa.svg';
import PersonIcon from '../assets/tela4/header/PersonIcon.svg';

// === FILTRO SVGs ===
// Substituídos por elementos nativos e Feather
// import FiltroIcon from '../assets/tela4/filtro/FiltroIcon.svg';

interface CatalogHeaderProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  title?: string;
  photoUri?: string | null;
}

/**
 * Header + Filtro compartilhado entre as telas.
 * Detecta automaticamente o estado ativo do perfil.
 */
export function CatalogHeader({ searchText: propSearchText, onSearchChange: propOnSearchChange, title = 'Catálogo', photoUri }: CatalogHeaderProps) {
  const { toggleMenu } = useUserMenu();
  const { colors, isDarkMode } = useTheme();
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { searchText, setSearchText } = useFilter();
  
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  const avatarKey = user ? `av_${user.id.slice(0, 8)}` : 'av_guest';

  const loadLocalPhoto = async () => {
    try {
      const savedUri = await SecureStore.getItemAsync(avatarKey);
      setLocalPhotoUri(savedUri);
    } catch (e) {
      setLocalPhotoUri(null);
    }
  };

  useEffect(() => {
    loadLocalPhoto();
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadLocalPhoto();
    });
    return unsubscribe;
  }, [navigation, user]);

  const activePhotoUri = photoUri !== undefined ? photoUri : localPhotoUri;
  
  // Verifica se estamos na tela de perfil para mudar a cor do ícone
  const isProfileActive = route.name === 'ProfileScreen';

  const [localSearchText, setLocalSearchText] = useState(searchText);

  const personScale = React.useRef(new Animated.Value(1)).current;

  const handlePersonPress = () => {
    // Animação de pulo/escala spring
    personScale.setValue(1);
    Animated.sequence([
      Animated.timing(personScale, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(personScale, {
        toValue: 1.15,
        useNativeDriver: true,
        friction: 4,
        tension: 100,
      }),
      Animated.timing(personScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      })
    ]).start();

    // Abre o menu de usuário
    toggleMenu();
  };

  useEffect(() => {
    if (isProfileActive) {
      personScale.setValue(1);
      Animated.sequence([
        Animated.timing(personScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(personScale, {
          toValue: 1.25,
          useNativeDriver: true,
          friction: 3,
          tension: 150,
        }),
        Animated.timing(personScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isProfileActive]);

  useEffect(() => {
    setLocalSearchText(searchText);
  }, [searchText]);

  const triggerSearch = () => {
    setSearchText(localSearchText);
    if (propOnSearchChange) {
      propOnSearchChange(localSearchText);
    }
    // Redireciona para o Catálogo (Menu) se estiver em outra tela
    if (route.name !== 'Menu') {
      navigation.navigate('Menu');
    }
  };

  return (
    <>
      {/* ========== PARTE SUPERIOR (#1C2434) ========== */}
      <View style={[styles.headerContainer, { backgroundColor: colors.headerBackground }]}>
        {/* Mini Logo (36x36) que sempre leva para o Catálogo (Menu) */}
        <TouchableOpacity onPress={() => navigation.navigate('Menu')} activeOpacity={0.7}>
          <MiniLogo width={36} height={36} />
        </TouchableOpacity>

        {/* Título Dinâmico */}
        <Text style={styles.catalogoText}>{title}</Text>

        {/* Barra de busca (#F2F2F2, rx=10) */}
        <View style={[styles.searchBar, { backgroundColor: isDarkMode ? '#2E2E38' : '#F2F2F2' }]}>
          <TouchableOpacity onPress={triggerSearch} activeOpacity={0.7}>
            {isDarkMode ? (
              <Feather name="search" size={18} color="#FFFFFF" style={{ marginRight: 4, marginLeft: 2 }} />
            ) : (
              <Lupa width={26} height={20} />
            )}
          </TouchableOpacity>
          <TextInput
            style={[styles.searchInput, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}
            placeholder="Procurar produtos..."
            placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
            value={localSearchText}
            onChangeText={setLocalSearchText}
            returnKeyType="search"
            onSubmitEditing={triggerSearch}
          />
        </View>

        {/* Person Icon ou foto do cliente (36x36) */}
        <TouchableOpacity 
          onPress={handlePersonPress} 
          activeOpacity={0.7}
        >
          <Animated.View
            style={[
              styles.personCircle, 
              { 
                backgroundColor: isProfileActive ? '#2BE060' : 'rgba(255,255,255,0.3)',
                transform: [{ scale: personScale }]
              }
            ]} 
          >
            {activePhotoUri ? (
              <Image 
                source={{ uri: activePhotoUri }} 
                style={{ width: 36, height: 36, borderRadius: 18 }} 
              />
            ) : (
              <PersonIcon width={46} height={46} />
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
}

interface CatalogFilterProps {
  activeCategory?: string;
}

export function CatalogFilter({ activeCategory }: CatalogFilterProps) {
  const { colors, isDarkMode } = useTheme();
  const { selectedCategories, toggleCategory } = useFilter();
  const route = useRoute();
  const navigation = useNavigation<any>();

  const handleCategoryPress = (category: string) => {
    toggleCategory(category);
    // Redireciona para o Catálogo se estiver em outra tela
    if (route.name !== 'Menu') {
      navigation.navigate('Menu');
    }
  };

  const labelColor = isDarkMode ? '#FFFFFF' : '#8A7268';
  const sepColor = isDarkMode ? '#FFFFFF' : '#8A7268';
  const textColor = isDarkMode ? '#FFFFFF' : '#1C2434';

  return (
    <View style={[styles.filterBar, { backgroundColor: colors.backgroundLight }]}>
      {/* Fundo pill (#E3E4EB, rx=30) para TODA a barra */}
      <View style={[styles.filterPill, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
        {/* FiltroIcon + texto */}
        <View style={styles.filterBtn}>
          <Feather name="sliders" size={12} color={labelColor} />
          <Text style={[styles.filterBtnText, { color: labelColor }]}>Filtro</Text>
        </View>

        <View style={[styles.filterSep, { backgroundColor: sepColor }]} />

        <Text style={[styles.categoryLabelText, { color: labelColor }]}>Categoria</Text>

        <View style={[styles.filterSep, { backgroundColor: sepColor }]} />

        {/* Tags — com destaque no ativo */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {['Ração', 'Pesca', 'Sementes', 'Adubo'].map((category) => {
            const isSelected = selectedCategories.includes(category);
            
            let tagBg = 'transparent';
            if (isSelected) {
              tagBg = isDarkMode ? '#5B86E5' : '#E3DAD9';
            }

            let tagTextColor = isDarkMode ? '#FFFFFF' : '#8A7268';
            if (isSelected) {
              tagTextColor = isDarkMode ? '#FFFFFF' : '#9C3F07';
            }

            return (
              <TouchableOpacity
                key={category}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.7}
                style={[
                  styles.tagItem,
                  { backgroundColor: tagBg }
                ]}
              >
                <Text 
                  style={[
                    styles.tagText, 
                    { 
                      color: tagTextColor,
                      fontWeight: isSelected ? 'bold' : 'normal'
                    }
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
    height: 20,
    backgroundColor: '#8A7268',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  categoryLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 10,
  },
  tagItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagActive: {
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
  },
});
