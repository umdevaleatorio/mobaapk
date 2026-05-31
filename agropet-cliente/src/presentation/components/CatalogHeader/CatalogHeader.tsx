import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useUserMenu } from '../../contexts/UserMenuContext';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useFilter } from '../../contexts/FilterContext';
import { Feather } from '@expo/vector-icons';
import MiniLogo from '../../assets/tela4/header/MiniLogo.svg';
import Lupa from '../../assets/tela4/header/Lupa.svg';
import PersonIcon from '../../assets/tela4/header/PersonIcon.svg';
import { styles } from './CatalogHeader.styles';

interface CatalogHeaderProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  title?: string;
  photoUri?: string | null;
}

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

  const isProfileActive = route.name === 'ProfileScreen';

  const [localSearchText, setLocalSearchText] = useState(searchText);

  const personScale = React.useRef(new Animated.Value(1)).current;

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
    if (route.name !== 'Menu') {
      navigation.navigate('Menu');
    }
  };

  return (
    <>
      <View style={[styles.headerContainer, { backgroundColor: colors.headerBackground, paddingTop: Platform.OS === 'android' ? 38 : 50 }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Menu')} activeOpacity={0.7}>
          <MiniLogo width={36} height={36} />
        </TouchableOpacity>

        <Text style={styles.catalogoText}>{title}</Text>

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
    if (route.name !== 'Menu') {
      navigation.navigate('Menu');
    }
  };

  const labelColor = isDarkMode ? '#FFFFFF' : '#8A7268';
  const sepColor = isDarkMode ? '#FFFFFF' : '#8A7268';
  const textColor = isDarkMode ? '#FFFFFF' : '#1C2434';

  return (
    <View style={[styles.filterBar, { backgroundColor: colors.backgroundLight }]}>
      <View style={[styles.filterPill, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
        <View style={styles.filterBtn}>
          <Feather name="sliders" size={12} color={labelColor} />
          <Text style={[styles.filterBtnText, { color: labelColor }]}>Filtro</Text>
        </View>

        <View style={[styles.filterSep, { backgroundColor: sepColor }]} />

        <Text style={[styles.categoryLabelText, { color: labelColor }]}>Categoria</Text>

        <View style={[styles.filterSep, { backgroundColor: sepColor }]} />

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
