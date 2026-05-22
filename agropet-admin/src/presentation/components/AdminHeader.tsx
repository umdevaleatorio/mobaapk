import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  Text,
  Image,
  Animated,
} from 'react-native';
import { useUserMenu } from '../contexts/UserMenuContext';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

import MenuInicialTitle from '../assets/tela2/header/Menu inicial.svg';
import OpcoesTitle from '../assets/tela4/parte superior/Opções.svg';
import VerPedidosTitle from '../assets/tela5/parte superior/Ver pedidos.svg';
import HistoricoVendasTitle from '../assets/tela6/parte superior/Histórico de vendas.svg';
import GerenciarProdutosTitle from '../assets/tela7/parte superior/Adicionar/Remover/Gerenciar produtos.svg';
import RegistrarProdutoTitle from '../assets/tela8/parte superior/Registrar produto.svg';
import PersonIcon from '../assets/tela2/header/Person Icon.svg';
import { Feather } from '@expo/vector-icons';
import AdmIcon from '../assets/tela2/header/Adm.svg';

// SVGs Admin Tela 2
import MiniLogo from '../assets/tela2/header/Mini Logo.svg';

interface AdminHeaderProps {
  title?: 'home' | 'mapa' | 'gerenciar' | 'opcoes' | 'ver_pedidos' | 'historico_vendas' | 'registrar_produto' | 'editar_produto' | 'perfil_adm' | 'detalhes_pedido';
  searchValue?: string;
  onSearchChange?: (text: string) => void;
}

export default function AdminHeader({ title = 'home', searchValue = '', onSearchChange }: AdminHeaderProps) {
  const { toggleMenu } = useUserMenu();
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme();
  const [localSearch, setLocalSearch] = React.useState(searchValue);
  const { user } = React.useContext(AuthContext);
  const [photoUri, setPhotoUri] = React.useState<string | null>(null);

  const personScale = React.useRef(new Animated.Value(1)).current;
  const isProfileActive = title === 'perfil_adm';

  const handlePersonPress = () => {
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
    toggleMenu();
  };

  React.useEffect(() => {
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

  const loadPhoto = async () => {
    if (!user) return;
    try {
      const avatarKey = `av_${user.id.slice(0, 8)}`;
      const savedUri = await SecureStore.getItemAsync(avatarKey);
      setPhotoUri(savedUri);
    } catch (e) {
      setPhotoUri(null);
    }
  };

  React.useEffect(() => {
    loadPhoto();
  }, [user]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPhoto();
    });
    return unsubscribe;
  }, [navigation, user]);

  React.useEffect(() => {
    setLocalSearch(searchValue);
  }, [searchValue]);

  const triggerSearch = () => {
    if (onSearchChange) {
      onSearchChange(localSearch);
    }
  };

  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.headerBackground }]}>
      {/* Mini Logo */}
      <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Home')}>
        <MiniLogo width={36} height={36} />
      </TouchableOpacity>

      {/* Title - Left aligned next to MiniLogo */}
      <View style={[styles.titleWrapper, { marginLeft: 8 }]}>
        {title === 'home' && <MenuInicialTitle width={120} height={20} />}
        {title === 'mapa' && <Text style={styles.textTitle}>Localizar entrega</Text>}
        {title === 'opcoes' && <OpcoesTitle width={80} height={20} />}
        {title === 'ver_pedidos' && <VerPedidosTitle width={110} height={20} />}
        {title === 'historico_vendas' && <HistoricoVendasTitle width={105} height={40} />}
        {title === 'gerenciar' && <GerenciarProdutosTitle width={80} height={38} />}
        {title === 'registrar_produto' && <RegistrarProdutoTitle width={80} height={38} />}
        {title === 'editar_produto' && <Text style={styles.textTitle}>Editar produto</Text>}
        {title === 'perfil_adm' && <Text style={styles.textTitle}>Perfil adm</Text>}
        {title === 'detalhes_pedido' && <Text style={styles.textTitle}>Detalhes do pedido</Text>}
      </View>

      {/* Right side: Adm text or Search Bar + Person Icon */}
      <View style={styles.rightGroup}>
        {(title === 'gerenciar' || title === 'registrar_produto' || title === 'editar_produto') ? (
          <View style={[styles.searchBar, { backgroundColor: isDarkMode ? '#2E2E38' : '#F2F2F2' }]}>
            <TouchableOpacity onPress={triggerSearch} activeOpacity={0.7}>
              <Feather 
                name="search" 
                size={16} 
                color={isDarkMode ? '#FFFFFF' : '#1C2434'} 
                style={{ marginRight: 4 }}
              />
            </TouchableOpacity>
            <TextInput 
              style={[styles.searchInput, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}
              value={localSearch}
              onChangeText={setLocalSearch}
              placeholder="Pesquisar..."
              placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
              returnKeyType="search"
              onSubmitEditing={triggerSearch}
            />
          </View>
        ) : (
          <AdmIcon width={45} height={25} style={{ marginRight: 8 }} />
        )}
        <TouchableOpacity 
          onPress={handlePersonPress} 
          activeOpacity={0.7}
        >
          <Animated.View
            style={[
              styles.personCircle,
              {
                backgroundColor: (isProfileActive && !photoUri) ? '#2BE060' : 'rgba(255,255,255,0.3)',
                transform: [{ scale: personScale }]
              }
            ]}
          >
            {photoUri ? (
              <Image 
                source={{ uri: photoUri }} 
                style={{ width: 36, height: 36, borderRadius: 18 }} 
              />
            ) : (
              <PersonIcon width={46} height={46} />
            )}
          </Animated.View>
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
  },
  rightGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  searchBar: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 13,
    paddingVertical: 0,
  },
});
