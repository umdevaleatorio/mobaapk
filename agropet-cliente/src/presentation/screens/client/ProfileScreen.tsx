import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TextInput,
  Text,
  Platform,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import { Keyboard } from 'react-native';
import { useUserMenu } from '../../contexts/UserMenuContext';
import { AuthContext } from '../../contexts/AuthContext';
import { CatalogHeader } from '../../components/CatalogHeader';
import { supabase } from '../../../data/datasources/supabase/client';
import { useTheme } from '../../contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';

import PhotoSvg from '../../assets/tela13/photo/Photo.svg';
import PersonIcon13 from '../../assets/tela13/photo/Person Icon.svg';

// Barra Inferior
import HomeIcon8 from '../../assets/tela11/barra de baixo/Home.svg';
import MapIcon8 from '../../assets/tela11/barra de baixo/Map.svg';
import CartIcon8 from '../../assets/tela11/barra de baixo/Cart.svg';
import GearIcon8 from '../../assets/tela11/barra de baixo/Gear.svg';
import MenuLabel8 from '../../assets/tela11/barra de baixo/Menu.svg';
import MapaLabel8 from '../../assets/tela11/barra de baixo/Mapa.svg';
import CarrinhoLabel8 from '../../assets/tela11/barra de baixo/Carrinho.svg';
import OpcoesLabel8 from '../../assets/tela11/barra de baixo/Opções.svg';

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
};

export default function ProfileScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const { toggleMenu } = useUserMenu();
  const { user } = React.useContext(AuthContext);
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Modais e fluxos
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle'|'loading'|'available'|'taken'|'invalid_format'>('idle');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<'cadastrar'|'validar'|'alterar'>('cadastrar');
  
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState<'validar'|'alterar'>('alterar');
  const [emailError, setEmailError] = useState('');
  const [emailCode, setEmailCode] = useState('');

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showImagePickerOptions, setShowImagePickerOptions] = useState(false);
  const [showViewPhotoModal, setShowViewPhotoModal] = useState(false);

  const [rua, setRua] = useState('');
  const [bairro, setBairro] = useState('');
  const [cep, setCep] = useState('');
  const [numero, setNumero] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [showAddressValidationErrors, setShowAddressValidationErrors] = useState(false);
  const [deliveryActive, setDeliveryActive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const firstEmptyField = (() => {
    if (!rua.trim()) return 'rua';
    if (!bairro.trim()) return 'bairro';
    if (!cep.trim()) return 'cep';
    if (!numero.trim()) return 'numero';
    return null;
  })();

  // Animação de fade para erros de endereço
  const addressErrorOpacity = React.useRef(new Animated.Value(0)).current;
  const errorTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAddressError = React.useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setShowAddressValidationErrors(true);
    Animated.timing(addressErrorOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    errorTimeoutRef.current = setTimeout(() => {
      Animated.timing(addressErrorOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(({ finished }: any) => {
        if (finished) {
          setShowAddressValidationErrors(false);
        }
      });
    }, 8000);
  }, [addressErrorOpacity]);

  // Limpar timeout ao desmontar
  React.useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  // Reset do locationConfirmed quando o endereço muda
  React.useEffect(() => {
    if (profileLoadedRef.current) {
      setLocationConfirmed(false);
    }
  }, [rua, bairro, cep, numero]);

  // Refs para focar nos inputs ao clicar em "Alterar"
  const ruaRef = React.useRef<TextInput>(null);
  const bairroRef = React.useRef<TextInput>(null);
  const cepRef = React.useRef<TextInput>(null);
  const numeroRef = React.useRef<TextInput>(null);
  const profileLoadedRef = React.useRef(false);
  const autoValidatingRef = React.useRef(false);
  const lastAttemptedAddressRef = React.useRef('');


  // Chave curta e única por usuário
  const avatarKey = user ? `av_${user.id.slice(0, 8)}` : 'av_guest';

  // Carregar foto salva ao abrir a tela
  React.useEffect(() => {
    const loadPhoto = async () => {
      try {
        const savedUri = await SecureStore.getItemAsync(avatarKey);
        if (savedUri) {
          setPhotoUri(savedUri);
        }
      } catch (e) {
        // Sem foto salva
      }
    };
    loadPhoto();

    // Limpeza única: remover avatar_url antigo do Supabase user_metadata
    if (user?.user_metadata?.avatar_url) {
      supabase.auth.updateUser({ data: { avatar_url: null } }).catch(() => {});
    }
  }, [user]);

  // Sincronizar status do e-mail com pendências do Supabase
  React.useEffect(() => {
    if (user?.new_email) {
      setEmailStatus('validar');
      setEmailInput(user.new_email);
    } else {
      setEmailStatus('alterar');
    }
  }, [user]);

  // Refresh session once on mount to clear stale auth metadata like new_email
  React.useEffect(() => {
    supabase.auth.refreshSession().catch(() => {});
  }, []);

  const fetchDeliveryStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('delivery_active')
        .maybeSingle();
      if (data && !error && data.delivery_active !== undefined) {
        setDeliveryActive(data.delivery_active);
        // Sincronizar parent ClientTabs
        if (typeof (global as any).refreshDeliveryTabs === 'function') {
          (global as any).refreshDeliveryTabs();
        }
      }
    } catch (e) {
      console.log('Error fetching delivery active in profile:', e);
    }
  };

  const fetchProfile = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, username, email, phone, rua, bairro, cep, numero, lat, lng, location_confirmed')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setNome(data.name || '');
        setUsuario(data.username || '');
        setEmail(data.email || user.email || '');
        setPhone(data.phone || '');
        if (data.phone) setPhoneStatus('alterar');
        
        // Prevenir que o carregamento inicial resete a confirmação de localização
        profileLoadedRef.current = false;
        
        setRua(data.rua || '');
        setBairro(data.bairro || '');
        setCep(data.cep || '');
        setNumero(data.numero || '');
        if (data.lat && data.lng) {
          setLat(data.lat);
          setLng(data.lng);
        } else {
          setLat(null);
          setLng(null);
        }
        setLocationConfirmed(data.location_confirmed || false);

        // Se o endereço estiver incompleto no DB, ativa as bordas vermelhas nos campos vazios
        const hasAny = data.rua || data.bairro || data.cep || data.numero;
        const hasEmpty = !data.rua || !data.bairro || !data.cep || !data.numero;
        if (hasAny && hasEmpty) {
          setShowAddressValidationErrors(true);
        } else {
          setShowAddressValidationErrors(false);
        }

        setTimeout(() => {
          profileLoadedRef.current = true;
        }, 150);
      }
    } catch (err) {
      console.log('Erro ao carregar perfil', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProfile(),
      fetchDeliveryStatus()
    ]);
    setRefreshing(false);
  };

  // Sincronizar status de frete ativo/inativo na barra inferior
  React.useEffect(() => {
    fetchDeliveryStatus();

    const channel = supabase
      .channel('store_settings_profile_tabs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings' },
        (payload) => {
          if (payload.new && (payload.new as any).delivery_active !== undefined) {
            setDeliveryActive((payload.new as any).delivery_active);
            // Sincronizar parent ClientTabs
            if (typeof (global as any).refreshDeliveryTabs === 'function') {
              (global as any).refreshDeliveryTabs();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Carregar dados do perfil (Nome, Endereço, Email, Phone, Username) do Supabase
  React.useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const autoValidateAddressIfPossible = async (
    currentRua: string,
    currentBairro: string,
    currentCep: string,
    currentNumero: string
  ) => {
    if (!user || autoValidatingRef.current) return;
    if (!deliveryActive) return;
    if (locationConfirmed) return;
    if (!currentRua.trim() || !currentBairro.trim() || !currentCep.trim() || !currentNumero.trim()) return;

    autoValidatingRef.current = true;
    try {
      const query = `${currentRua}, ${currentNumero}, ${currentBairro}, Lambari, Minas Gerais, Brasil`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'AgropetAppCliente/1.0',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          }
        }
      );
      
      let resolvedLat: number | null = null;
      let resolvedLng: number | null = null;

      const data = await response.json();
      if (data && data.length > 0) {
        resolvedLat = parseFloat(data[0].lat);
        resolvedLng = parseFloat(data[0].lon);
      } else {
        const fallbackQuery = `${currentRua}, ${currentBairro}, Lambari, Minas Gerais, Brasil`;
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1&countrycodes=br&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'AgropetAppCliente/1.0',
              'Accept-Language': 'pt-BR,pt;q=0.9',
            }
          }
        );
        const fallbackData = await fallbackResponse.json();
        if (fallbackData && fallbackData.length > 0) {
          resolvedLat = parseFloat(fallbackData[0].lat);
          resolvedLng = parseFloat(fallbackData[0].lon);
        }
      }

      if (resolvedLat && resolvedLng) {
        let storeLat = -21.9765;
        let storeLng = -45.3469;
        let maxRadius = 17;

        try {
          const { data: storeLoc, error: storeLocError } = await supabase
            .from('agropet_store_location')
            .select('latitude, longitude')
            .eq('id', 1)
            .single();
          if (storeLoc && !storeLocError) {
            storeLat = storeLoc.latitude;
            storeLng = storeLoc.longitude;
          }
        } catch (e) {
          console.log('Error loading store location in auto-save:', e);
        }

        try {
          const { data: settings, error: settingsError } = await supabase
            .from('store_settings')
            .select('delivery_radius_km')
            .maybeSingle();
          if (settings && !settingsError && settings.delivery_radius_km !== null) {
            maxRadius = settings.delivery_radius_km;
          }
        } catch (e) {
          console.log('Error loading settings in auto-save:', e);
        }

        const distance = getDistanceKm(storeLat, storeLng, resolvedLat, resolvedLng);
        if (distance > maxRadius) {
          return;
        }

        const { error: updateError } = await supabase
          .from('users')
          .update({
            lat: resolvedLat,
            lng: resolvedLng,
            location_confirmed: true
          })
          .eq('id', user.id);

        if (!updateError) {
          setLat(resolvedLat);
          setLng(resolvedLng);
          setLocationConfirmed(true);
          
          Alert.alert(
            'Oba! Frete Reativado 📍',
            'Seu endereço foi localizado automaticamente no mapa agora que o frete está ativo!\n\nTodos os recursos de mapa, traçado de rotas e acompanhamento de pedidos foram liberados para você! 🏠🗺️',
            [
              {
                text: 'Ver no Mapa',
                onPress: () => {
                  navigation.navigate('ClientTabs', { screen: 'Mapa' });
                }
              },
              { text: 'OK' }
            ]
          );
        }
      }
    } catch (err) {
      console.log('Erro na auto-validação de endereço:', err);
    } finally {
      autoValidatingRef.current = false;
    }
  };

  // Monitorar deliveryActive e profileLoadedRef para auto-validação de endereço
  React.useEffect(() => {
    if (deliveryActive && profileLoadedRef.current && !locationConfirmed) {
      const hasAllFields = rua.trim() && bairro.trim() && cep.trim() && numero.trim();
      if (hasAllFields) {
        const addrStr = `${rua.trim()}|${bairro.trim()}|${cep.trim()}|${numero.trim()}`;
        if (lastAttemptedAddressRef.current !== addrStr) {
          lastAttemptedAddressRef.current = addrStr;
          autoValidateAddressIfPossible(rua, bairro, cep, numero);
        }
      }
    }
  }, [deliveryActive, locationConfirmed, rua, bairro, cep, numero]);


  // Salvar Nome no Supabase com Debounce
  React.useEffect(() => {
    if (!user || !profileLoadedRef.current) return;
    const delay = setTimeout(() => {
      supabase.from('users').update({ name: nome }).eq('id', user.id).then();
    }, 1000);
    return () => clearTimeout(delay);
  }, [nome, user]);

  // Salvar Endereço, Coordenadas e Confirmação no Supabase com Debounce
  React.useEffect(() => {
    if (!user || !profileLoadedRef.current) return;
    const delay = setTimeout(() => {
      const updateData: any = { 
        rua, 
        bairro, 
        cep, 
        numero,
        location_confirmed: locationConfirmed,
        lat: lat,
        lng: lng
      };
      supabase.from('users').update(updateData).eq('id', user.id).then();
    }, 1000);
    return () => clearTimeout(delay);
  }, [rua, bairro, cep, numero, lat, lng, locationConfirmed, user]);

  // Busca debounced de endereço via Nominatim (igual ao Admin Maps)
  React.useEffect(() => {
    const delay = setTimeout(() => {
      if (rua.trim().length > 2 && ruaRef.current?.isFocused()) {
        fetchAddressSuggestions(rua);
      } else {
        setAddressSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [rua]);

  const fetchAddressSuggestions = async (query: string) => {
    try {
      setIsSearchingAddress(true);
      const queryWithCity = `${query}, Lambari, Minas Gerais, Brasil`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithCity)}&limit=5&countrycodes=br&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'AgropetAppCliente/1.0',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          }
        }
      );
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        setAddressSuggestions(data);
      } catch (e) {
        console.log('Erro JSON Nominatim');
      }
    } catch (error) {
      console.log('Erro ao buscar endereço');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSelectAddress = (item: any) => {
    Keyboard.dismiss();
    setAddressSuggestions([]);

    const addr = item.address || {};
    const displayName = item.display_name || '';
    const parts = displayName.split(',').map((p: string) => p.trim());

    // 1. Rua
    setRua(addr.road || addr.pedestrian || addr.footway || parts[0] || '');
    
    // 2. Bairro (Fallback robusto pelo display_name se falhar no address)
    const bairroCandidates = [addr.suburb, addr.neighbourhood, addr.quarter, addr.city_district, addr.village];
    let bairroResult = bairroCandidates.find((b) => b && b.toLowerCase() !== 'lambari');
    
    if (!bairroResult) {
      // Extrai do display_name pulando itens indesejados
      const invalidTerms = ['lambari', 'minas gerais', 'brasil', 'região', 'microrregião', 'mesorregião'];
      for (let i = 1; i < parts.length; i++) {
        const p = parts[i];
        const pLower = p.toLowerCase();
        const isInvalid = invalidTerms.some(inv => pLower.includes(inv));
        const isCep = /\d{5}-\d{3}/.test(p);
        if (!isInvalid && !isCep) {
          bairroResult = p;
          break;
        }
      }
    }
    setBairro(bairroResult || '');
    
    // 3. CEP (Extrai com Regex do display_name se falhar no address)
    let cepResult = addr.postcode || '';
    if (!cepResult) {
      const cepMatch = displayName.match(/\d{5}-\d{3}/);
      if (cepMatch) cepResult = cepMatch[0];
    }
    setCep(cepResult);
    
    // 4. Número
    setNumero(addr.house_number || '');

    // 5. Salva Coordenadas para o Mapa de Rotas depois
    if (item.lat && item.lon) {
      setLat(parseFloat(item.lat));
      setLng(parseFloat(item.lon));
    }
  };

  const handleSendAddress = async () => {
    if (!rua.trim() || !bairro.trim() || !cep.trim() || !numero.trim()) {
      triggerAddressError();
      return;
    }

    try {
      setIsSearchingAddress(true);

      // Check if delivery is active first
      const { data: settings, error: settingsError } = await supabase
        .from('store_settings')
        .select('delivery_active')
        .maybeSingle();

      if (settings && !settingsError && settings.delivery_active === false) {
        if (user) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              rua,
              bairro,
              cep,
              numero,
              lat: null,
              lng: null,
              location_confirmed: false
            })
            .eq('id', user.id);

          if (updateError) {
            Alert.alert('Erro', 'Não foi possível salvar o endereço.');
          } else {
            setLat(null);
            setLng(null);
            setLocationConfirmed(false);
            Alert.alert(
              'Sucesso',
              'Suas informações foram registradas com sucesso! Porém não é possível registrar sua localização no mapa pois o frete encontra-se inativo no momento. Quando voltarmos da manutenção do veículo, você já terá todas as funcionalidades do mapa ativo. Não se preocupe! Voltaremos em breve!'
            );
          }
        }
        return;
      }

      let currentLat = lat;
      let currentLng = lng;

      // Se o usuário digitou ou alterou manualmente, vamos buscar no Nominatim para maior precisão
      const query = `${rua}, ${numero}, ${bairro}, Lambari, Minas Gerais, Brasil`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'AgropetAppCliente/1.0',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          }
        }
      );
      
      const data = await response.json();
      if (data && data.length > 0) {
        currentLat = parseFloat(data[0].lat);
        currentLng = parseFloat(data[0].lon);
        setLat(currentLat);
        setLng(currentLng);
      } else {
        // Tenta sem o número se falhar com número
        const fallbackQuery = `${rua}, ${bairro}, Lambari, Minas Gerais, Brasil`;
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1&countrycodes=br&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'AgropetAppCliente/1.0',
              'Accept-Language': 'pt-BR,pt;q=0.9',
            }
          }
        );
        const fallbackData = await fallbackResponse.json();
        if (fallbackData && fallbackData.length > 0) {
          currentLat = parseFloat(fallbackData[0].lat);
          currentLng = parseFloat(fallbackData[0].lon);
          setLat(currentLat);
          setLng(currentLng);
        }
      }
      
      if (!currentLat || !currentLng) {
        Alert.alert(
          'Endereço não localizado',
          'Não conseguimos encontrar as coordenadas exatas deste endereço no mapa. Deseja salvar mesmo assim?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Salvar mesmo assim',
              onPress: async () => {
                await saveAddressToDB(null, null, false);
              }
            }
          ]
        );
        return;
      }

      await saveAddressToDB(currentLat, currentLng, true);

    } catch (err) {
      console.log('Erro ao buscar coordenadas no Enviar', err);
      // Fallback
      await saveAddressToDB(lat, lng, true);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const saveAddressToDB = async (resolvedLat: number | null, resolvedLng: number | null, confirmLocation: boolean) => {
    if (!user) return;
    
    if (resolvedLat && resolvedLng && confirmLocation) {
      let storeLat = -21.9765;
      let storeLng = -45.3469;
      let maxRadius = 17;

      try {
        const { data: storeLoc, error: storeLocError } = await supabase
          .from('agropet_store_location')
          .select('latitude, longitude')
          .eq('id', 1)
          .single();
        if (storeLoc && !storeLocError) {
          storeLat = storeLoc.latitude;
          storeLng = storeLoc.longitude;
        }
      } catch (e) {
        console.log('Error loading store location in save:', e);
      }

      try {
        const { data: settings, error: settingsError } = await supabase
          .from('store_settings')
          .select('delivery_radius_km')
          .maybeSingle();
        if (settings && !settingsError && settings.delivery_radius_km !== null) {
          maxRadius = settings.delivery_radius_km;
        }
      } catch (e) {
        console.log('Error loading settings in save:', e);
      }

      const distance = getDistanceKm(storeLat, storeLng, resolvedLat, resolvedLng);
      if (distance > maxRadius) {
        Alert.alert(
          'Fora da Área de Entrega',
          'Infelizmente nossos serviços de frete não alcançam essa área. Obrigado pela compreensão.'
        );
        return;
      }
    }
    
    const updateData: any = {
      rua,
      bairro,
      cep,
      numero,
      location_confirmed: confirmLocation
    };

    if (resolvedLat && resolvedLng) {
      updateData.lat = resolvedLat;
      updateData.lng = resolvedLng;
    }

    const { error } = await supabase
       .from('users')
       .update(updateData)
       .eq('id', user.id);

    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar o endereço.');
    } else {
      setLocationConfirmed(confirmLocation);
      setShowAddressValidationErrors(false);
      if (confirmLocation) {
        Alert.alert(
          'Endereço Enviado!',
          'Seu endereço foi salvo com sucesso e sua localização foi confirmada no mapa! 📍\n\nParabéns! Você desbloqueou novos recursos em seu mapa:\n• Ponto exato da sua casa demarcado 🏠\n• Opção de focar/mirar na sua casa 🎯\n• Roteirização/Traçado de rotas 🗺️\n• Legenda completa dos status de entrega',
          [
            {
              text: 'Ver no Mapa',
              onPress: () => {
                navigation.navigate('ClientTabs', { screen: 'Mapa' });
              }
            },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert('Sucesso', 'Endereço salvo com sucesso.');
      }
    }
  };

  // Busca debounced para validar username
  React.useEffect(() => {
    if (usernameInput.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    // Validação de formato: permite apenas letras (sem acento), números, _ e .
    const isValidFormat = /^[a-zA-Z0-9_.]+$/.test(usernameInput);
    if (!isValidFormat) {
      setUsernameStatus('invalid_format' as any);
      return;
    }

    const checkVal = usernameInput.toLowerCase();
    
    // Se for o mesmo username que o usuário já tem, está disponível imediatamente
    if (checkVal === usuario.toLowerCase()) {
      setUsernameStatus('available');
      return;
    }

    setUsernameStatus('loading');
    const delay = setTimeout(async () => {
      try {
        // Tentar usar o RPC de verificação global (bypassa RLS de forma segura)
        const { data: exists, error: rpcError } = await supabase
          .rpc('check_username_exists', { username_to_check: checkVal });

        let isTaken = false;
        if (rpcError) {
          console.warn('RPC check_username_exists falhou, usando fallback direto:', rpcError);
          // Fallback para consulta direta (com as limitações de RLS, mas seguro contra falhas críticas)
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('username', checkVal)
            .maybeSingle();
          
          if (data && data.id !== user?.id) {
            isTaken = true;
          }
        } else {
          isTaken = !!exists;
        }

        if (isTaken) {
          setUsernameStatus('taken');
          // Gerar sugestões simples
          const base = checkVal;
          setUsernameSuggestions([`${base}_721`, `${base}_br`, `${base}1`]);
        } else {
          setUsernameStatus('available');
        }
      } catch (err) {
        setUsernameStatus('idle');
      }
    }, 600);
    return () => clearTimeout(delay);
  }, [usernameInput, usuario, user]);

  const handleSaveUsername = () => {
    if (usernameStatus !== 'available') return;
    Alert.alert(
      'Atenção',
      'Tem certeza que deseja colocar esse nome de usuário à sua conta? Não terá como trocar depois',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: async () => {
            if (!user) return;
            const newUsername = usernameInput.toLowerCase();
            const { error } = await supabase.from('users').update({ username: newUsername }).eq('id', user.id);
            if (!error) {
              setUsuario(newUsername);
              setShowUsernameModal(false);
            } else {
              if (error.code === '23505') {
                Alert.alert('Erro', 'Este nome de usuário já está sendo usado, por favor escolha outro.');
              } else {
                Alert.alert('Erro', 'Não foi possível salvar o nome de usuário.');
              }
            }
          }
        }
      ]
    );
  };

  const handleConfirmPhone = async () => {
    // Simulação da validação do SMS
    if (phoneStatus === 'cadastrar' || phoneStatus === 'alterar') {
      // Simula enviar SMS e muda pra Validar
      setPhoneStatus('validar');
    } else if (phoneStatus === 'validar') {
      // Simula código correto e salva
      if (user) {
        // Desvincular de outra conta se existir (simulação visual, DB trigger cuidaria disso)
        await supabase.from('users').update({ phone: phoneInput }).eq('id', user.id);
        setPhone(phoneInput);
        setPhoneStatus('alterar');
        setShowPhoneModal(false);
      }
    }
  };

  const handleConfirmEmail = async () => {
    if (emailStatus === 'alterar') {
      setEmailError('');
      if (emailInput.trim().toLowerCase() === user?.email?.trim().toLowerCase()) {
        setEmailError('O e-mail digitado é o mesmo já cadastrado nesta conta. Insira um novo e-mail para alterar.');
        return;
      }
      // Verifica se o email já existe noutra conta
      const { data } = await supabase.from('users').select('id').eq('email', emailInput.toLowerCase()).maybeSingle();
      if (data && data.id !== user?.id) {
        setEmailError('Este e-mail já está sendo usado. Por favor, escolha outro e-mail de seu uso.');
        return;
      }
      
      // Manda o email real de verificação pelo Supabase
      const { error } = await supabase.auth.updateUser({ email: emailInput.toLowerCase() });
      if (error) {
        setEmailError('Falha ao enviar e-mail de verificação: ' + error.message);
        return;
      }
      
      setEmailCode('');
      setEmailStatus('validar');
    } else if (emailStatus === 'validar') {
      // Valida o código OTP real pelo Supabase
      if (user) {
        const { error } = await supabase.auth.verifyOtp({ 
          email: emailInput.toLowerCase(), 
          token: emailCode, 
          type: 'email_change' 
        });

        if (error) {
          setEmailError('Código inválido ou expirado.');
          return;
        }

        // Sucesso: atualiza no banco também
        await supabase.from('users').update({ email: emailInput.toLowerCase() }).eq('id', user.id);
        await supabase.auth.refreshSession().catch(() => {});
        setEmail(emailInput.toLowerCase());
        setEmailStatus('alterar');
        setShowEmailModal(false);
      }
    }
  };

  const handleSelectPhoto = () => {
    setShowImagePickerOptions(true);
  };

  const openCamera = async () => {
    setShowImagePickerOptions(false);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'Você precisa permitir o acesso à câmera para tirar uma foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      try { await SecureStore.setItemAsync(avatarKey, uri); } catch (e) {}
    }
  };

  const openGallery = async () => {
    setShowImagePickerOptions(false);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'Você precisa permitir o acesso à galeria para selecionar uma foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      try { await SecureStore.setItemAsync(avatarKey, uri); } catch (e) {}
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.backgroundLight }]}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" />

      {/* ========== HEADER ========== */}
      <CatalogHeader 
        title="Seu perfil"
        searchText=""
        onSearchChange={() => {}} 
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
            
          <View style={styles.profileHeaderRow}>
            <View style={styles.photoContainer}>
               <View style={[
                  styles.photoPlaceholder,
                  isDarkMode ? {
                    backgroundColor: '#000000',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: '#2E2E38',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                    elevation: 3,
                  } : null
               ]}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.profilePhoto} />
                  ) : (
                    isDarkMode ? (
                      <View style={[
                        styles.personIconCircle,
                        { backgroundColor: '#2E2E38' }
                      ]}>
                        <Feather name="user" size={36} color="#FFFFFF" />
                      </View>
                    ) : (
                      <>
                        <PhotoSvg width={110} height={110} style={{ position: 'absolute' }} />
                        <PersonIcon13 width={70} height={70} style={{ position: 'absolute' }} />
                      </>
                    )
                  )}
               </View>
               <TouchableOpacity onPress={handleSelectPhoto}>
                  <Text style={[styles.alterarFotoText, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar foto</Text>
               </TouchableOpacity>
            </View>

            <View style={styles.topFields}>
                <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.textDark }]}>Nome:</Text>
                    <View style={[styles.textInputBox, { backgroundColor: colors.cardBackground }]}>
                        <TextInput 
                          style={[styles.input, { color: nome ? colors.textDark : '#919191' }]} 
                          placeholder="Digite o seu nome aqui..."
                          placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                          value={nome}
                          onChangeText={setNome}
                        />
                    </View>
                </View>
                <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.textDark }]}>Nome de usuário:</Text>
                    <TouchableOpacity 
                      style={[styles.textInputBox, { backgroundColor: colors.cardBackground }]}
                      onPress={() => {
                        if (!usuario) {
                          setUsernameInput('');
                          setUsernameStatus('idle');
                          setShowUsernameModal(true);
                        }
                      }}
                      disabled={!!usuario}
                    >
                        <Text style={[styles.input, { color: usuario ? colors.textDark : '#919191' }]}>
                          {usuario || 'Definir nome de usuário...'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
          </View>

          {/* Telefone */}
          <View style={styles.infoRow}>
             <Text style={[styles.fieldLabel, { color: colors.textDark }]}>Número de telefone cadastrado</Text>
             <View style={[styles.infoBox, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.infoText, { color: phone ? colors.textDark : (isDarkMode ? '#8E8E93' : '#767676') }]}>{phone || 'Nenhum telefone cadastrado'}</Text>
                
                {phoneStatus === 'cadastrar' && (
                  <TouchableOpacity onPress={() => { setPhoneInput(''); setShowPhoneModal(true); }}>
                      <Text style={[styles.alterarLink, { color: '#00C853' }]}>Cadastrar</Text>
                  </TouchableOpacity>
                )}
                {phoneStatus === 'validar' && (
                  <TouchableOpacity onPress={() => setShowPhoneModal(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: '#FFC107', fontSize: 16, marginRight: 4 }}>!</Text>
                      <Text style={[styles.alterarLink, { color: '#FFC107' }]}>Validar</Text>
                  </TouchableOpacity>
                )}
                {phoneStatus === 'alterar' && (
                  <TouchableOpacity onPress={() => { setPhoneInput(phone); setShowPhoneModal(true); }}>
                      <Text style={[styles.alterarLink, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
                  </TouchableOpacity>
                )}
             </View>
          </View>

          {/* E-mail */}
          <View style={styles.infoRow}>
             <Text style={[styles.fieldLabel, { color: colors.textDark }]}>E-mail cadastrado</Text>
             <View style={[styles.infoBox, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.infoText, { color: email ? colors.textDark : (isDarkMode ? '#8E8E93' : '#767676') }]}>{email || 'meuemail@email.com'}</Text>
                
                {emailStatus === 'validar' ? (
                  <TouchableOpacity onPress={() => setShowEmailModal(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ color: '#FFC107', fontSize: 16, marginRight: 4 }}>!</Text>
                      <Text style={[styles.alterarLink, { color: '#FFC107' }]}>Validar</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => { setEmailInput(email); setEmailError(''); setShowEmailModal(true); }}>
                      <Text style={[styles.alterarLink, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
                  </TouchableOpacity>
                )}
             </View>
          </View>

          {/* ========== CARD ENDEREÇO (#1C2434) ========== */}
          <View style={[styles.addressCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#1C2434' }]}>
             <View style={styles.addressHeaderRow}>
                <Text style={styles.addressTitle}>Endereço</Text>
                <TouchableOpacity 
                  style={[
                    styles.enviarBtn, 
                    locationConfirmed ? styles.enviarBtnConfirmed : styles.enviarBtnActive
                  ]}
                  onPress={handleSendAddress}
                  activeOpacity={0.8}
                >
                  <Text style={styles.enviarBtnText}>
                    {locationConfirmed ? '✓ Enviado' : 'Enviar'}
                  </Text>
                </TouchableOpacity>
             </View>
             
             {/* Rua - com autocomplete */}
              <View style={[styles.addressFieldGroup, { zIndex: 10 }]}>
                 <Text style={styles.addressLabel}>Rua</Text>
                 <View style={[
                   styles.addressInputBox, 
                   { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB' },
                   (showAddressValidationErrors && !rua.trim()) ? styles.addressInputBoxError : null
                 ]}>
                     <TextInput 
                       ref={ruaRef}
                       style={[styles.addressInput, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]} 
                       placeholder="Digite sua rua..." 
                       placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                       value={rua}
                       onChangeText={setRua}
                     />
                     <TouchableOpacity onPress={() => ruaRef.current?.focus()}>
                       <Text style={[styles.alterarLinkAddr, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
                     </TouchableOpacity>
                 </View>
                  {showAddressValidationErrors && firstEmptyField === 'rua' && (
                     <Animated.View style={{ opacity: addressErrorOpacity }}>
                       <Text style={styles.addressErrorText}>Preencha todos os campos para continuar</Text>
                     </Animated.View>
                  )}
                 {/* Dropdown de sugestões */}
                 {addressSuggestions.length > 0 && (
                   <ScrollView 
                     style={[styles.suggestionsDropdown, { backgroundColor: isDarkMode ? '#1E1E24' : '#2A3444' }]} 
                     keyboardShouldPersistTaps="handled"
                     nestedScrollEnabled
                   >
                     {addressSuggestions.map((item, index) => (
                       <TouchableOpacity 
                         key={index} 
                         style={styles.suggestionItem}
                         onPress={() => handleSelectAddress(item)}
                       >
                         <Text style={styles.suggestionText} numberOfLines={2}>{item.display_name}</Text>
                       </TouchableOpacity>
                     ))}
                   </ScrollView>
                 )}
              </View>

              {/* Bairro */}
              <View style={styles.addressFieldGroup}>
                 <Text style={styles.addressLabel}>Bairro</Text>
                 <View style={[
                   styles.addressInputBox, 
                   { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB' },
                   (showAddressValidationErrors && !bairro.trim()) ? styles.addressInputBoxError : null
                 ]}>
                     <TextInput 
                       ref={bairroRef}
                       style={[styles.addressInput, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]} 
                       placeholder="Digite seu bairro..." 
                       placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                       value={bairro}
                       onChangeText={setBairro}
                     />
                     <TouchableOpacity onPress={() => bairroRef.current?.focus()}>
                       <Text style={[styles.alterarLinkAddr, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
                     </TouchableOpacity>
                 </View>
                  {showAddressValidationErrors && firstEmptyField === 'bairro' && (
                     <Animated.View style={{ opacity: addressErrorOpacity }}>
                       <Text style={styles.addressErrorText}>Preencha todos os campos para continuar</Text>
                     </Animated.View>
                  )}
              </View>

              {/* CEP e N° */}
              <View style={styles.row}>
                 <View style={[styles.addressFieldGroup, { flex: 1.5, marginRight: 10 }]}>
                     <Text style={styles.addressLabel}>CEP</Text>
                     <View style={[
                       styles.addressInputBox, 
                       { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB' },
                       (showAddressValidationErrors && !cep.trim()) ? styles.addressInputBoxError : null
                     ]}>
                         <TextInput 
                           ref={cepRef}
                           style={[styles.addressInput, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]} 
                           placeholder="00000-000" 
                           placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                           value={cep}
                           onChangeText={setCep}
                         />
                         <TouchableOpacity onPress={() => cepRef.current?.focus()}>
                           <Text style={[styles.alterarLinkAddr, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
                         </TouchableOpacity>
                     </View>
                      {showAddressValidationErrors && firstEmptyField === 'cep' && (
                         <Animated.View style={{ opacity: addressErrorOpacity }}>
                           <Text style={styles.addressErrorText}>Preencha todos os campos para continuar</Text>
                         </Animated.View>
                      )}
                 </View>
                 <View style={[styles.addressFieldGroup, { flex: 1 }]}>
                     <Text style={styles.addressLabel}>N°</Text>
                     <View style={[
                       styles.addressInputBox, 
                       { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB' },
                       (showAddressValidationErrors && !numero.trim()) ? styles.addressInputBoxError : null
                     ]}>
                         <TextInput 
                           ref={numeroRef}
                           style={[styles.addressInput, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]} 
                           placeholder="N°" 
                           placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                           value={numero}
                           onChangeText={setNumero}
                           keyboardType="numeric"
                         />
                         <TouchableOpacity onPress={() => numeroRef.current?.focus()}>
                           <Text style={[styles.alterarLinkAddr, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
                         </TouchableOpacity>
                     </View>
                      {showAddressValidationErrors && firstEmptyField === 'numero' && (
                         <Animated.View style={{ opacity: addressErrorOpacity }}>
                           <Text style={styles.addressErrorText}>Preencha todos os campos para continuar</Text>
                         </Animated.View>
                      )}
                 </View>
              </View>

             <Text style={styles.obsText}>
                Obs: pedimos o seu endereço para entregarmos seu produto em sua casa caso opte por frete.{"\n"}
                Frete válido apenas em Lambari.
             </Text>
          </View>
      </ScrollView>

      {/* ========== BARRA INFERIOR ========== */}
      <View style={styles.tabBarOuter}>
        <View style={[styles.tabBarInner, { backgroundColor: isDarkMode ? '#000000' : '#E3E4EB' }]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Menu' })}>
            <View style={styles.iconBgInactive}>
              <HomeIcon8 width={32} height={32} />
            </View>
            <MenuLabel8 width={33} height={9} />
          </TouchableOpacity>
          <View style={styles.tabSeparator} />

          {deliveryActive && (
            <>
              <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Mapa' })}>
                <View style={styles.iconBgInactive}>
                  <MapIcon8 width={32} height={32} />
                </View>
                <MapaLabel8 width={32} height={12} />
              </TouchableOpacity>
              <View style={styles.tabSeparator} />
            </>
          )}
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

      {/* MODAL USERNAME */}
      <Modal visible={showUsernameModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>Escolha seu nome de usuário</Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>Lembre-se: não será possível alterar depois.</Text>
            
            {usernameStatus === 'taken' && (
              <Text style={styles.usernameErrorMsg}>Este nome de usuário já está sendo usado, por favor, escolha outro</Text>
            )}
            {usernameStatus === 'invalid_format' && (
              <>
                <Text style={styles.usernameErrorMsg}>Caracteres especiais não são permitidos: !@#$%¨&*()</Text>
                <Text style={styles.usernameSuccessMsg}>(Permitido: _ e . no meio. Ex: usuario_123)</Text>
              </>
            )}
            
            <TextInput
              style={[
                styles.whiteModalInput,
                { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', color: colors.textDark, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' },
                usernameStatus === 'available' ? styles.inputSuccess : null,
                (usernameStatus === 'taken' || usernameStatus === 'invalid_format') ? styles.inputError : null
              ]}
              placeholder="Ex: usuario123"
              placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
              value={usernameInput}
              onChangeText={setUsernameInput}
              autoCapitalize="none"
            />
            
            {usernameStatus === 'available' && (
              <Text style={styles.usernameSuccessMsg}>Este nome de usuário está disponível</Text>
            )}

            {usernameStatus === 'taken' && (
              <View style={styles.suggestionsContainer}>
                <Text style={[styles.suggestionsTitle, { color: colors.textDark }]}>Sugestões disponíveis:</Text>
                {usernameSuggestions.map(sug => (
                  <TouchableOpacity key={sug} onPress={() => setUsernameInput(sug)} style={[styles.suggestionBadge, { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB' }]}>
                    <Text style={[styles.suggestionBadgeText, { color: colors.textDark }]}>{sug}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.whiteModalButtons}>
              <TouchableOpacity style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} onPress={() => setShowUsernameModal(false)}>
                <Text style={[styles.whiteModalBtnTextCancel, { color: isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.whiteModalBtnConfirm, usernameStatus !== 'available' && { opacity: 0.5 }]} 
                onPress={handleSaveUsername}
                disabled={usernameStatus !== 'available'}
              >
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL TELEFONE */}
      <Modal visible={showPhoneModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>
              {phoneStatus === 'validar' ? 'Validar Telefone' : 'Digite seu telefone'}
            </Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
              {phoneStatus === 'validar' 
                ? 'Enviamos um código SMS para o seu número. (Simulação: clique em Confirmar para validar)' 
                : 'Insira o número com DDD para continuar.'}
            </Text>
            
            <TextInput
              style={[styles.whiteModalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', color: colors.textDark, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }]}
              placeholder={phoneStatus === 'validar' ? "Código SMS..." : "+55 (11) 99999-9999"}
              placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
            />
            
            <View style={styles.whiteModalButtons}>
              <TouchableOpacity style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} onPress={() => setShowPhoneModal(false)}>
                <Text style={[styles.whiteModalBtnTextCancel, { color: isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.whiteModalBtnConfirm} onPress={handleConfirmPhone}>
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL E-MAIL */}
      <Modal visible={showEmailModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>
              {emailStatus === 'validar' ? 'Validar E-mail' : 'Alterar E-mail'}
            </Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
              {emailStatus === 'validar' 
                ? 'Verifique a caixa de entrada do seu novo e-mail. (Simulação: clique em Confirmar)' 
                : 'Insira o novo endereço de e-mail.'}
            </Text>

            {!!emailError && (
              <Text style={styles.usernameErrorMsg}>{emailError}</Text>
            )}
            
            {emailStatus === 'validar' ? (
              <TextInput
                style={[styles.whiteModalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', color: colors.textDark, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, emailError ? styles.inputError : null]}
                placeholder="Código de 6 dígitos..."
                placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                value={emailCode}
                onChangeText={setEmailCode}
                keyboardType="numeric"
              />
            ) : (
              <TextInput
                style={[styles.whiteModalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', color: colors.textDark, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, emailError ? styles.inputError : null]}
                placeholder="novo@email.com"
                placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
            
            <View style={styles.whiteModalButtons}>
              <TouchableOpacity style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} onPress={() => setShowEmailModal(false)}>
                <Text style={[styles.whiteModalBtnTextCancel, { color: isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.whiteModalBtnConfirm} onPress={handleConfirmEmail}>
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Image Picker Modal - Mesmo design do Admin */}
      <Modal
        visible={showImagePickerOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePickerOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowImagePickerOptions(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Alterar Foto de Perfil</Text>
            
            {photoUri && (
              <>
                <TouchableOpacity 
                  style={styles.modalOption} 
                  onPress={() => {
                    setShowImagePickerOptions(false);
                    setShowViewPhotoModal(true);
                  }}
                >
                  <Text style={styles.modalOptionText}>Ver foto</Text>
                </TouchableOpacity>
                <View style={styles.modalSeparator} />
              </>
            )}
            
            <TouchableOpacity style={styles.modalOption} onPress={openCamera}>
              <Text style={styles.modalOptionText}>Tirar Foto</Text>
            </TouchableOpacity>
            
            <View style={styles.modalSeparator} />
            
            <TouchableOpacity style={styles.modalOption} onPress={openGallery}>
              <Text style={styles.modalOptionText}>Escolher da Galeria</Text>
            </TouchableOpacity>
            
            {photoUri && (
              <>
                <View style={styles.modalSeparator} />
                <TouchableOpacity 
                  style={styles.modalOption} 
                  onPress={async () => {
                    setPhotoUri(null);
                    try { await SecureStore.deleteItemAsync(avatarKey); } catch (e) {}
                    setShowImagePickerOptions(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: '#FF6B6B' }]}>Remover Foto</Text>
                </TouchableOpacity>
              </>
            )}
            
            <View style={styles.modalSeparator} />
            
            <TouchableOpacity 
              style={[styles.modalOption, { marginTop: 10 }]} 
              onPress={() => setShowImagePickerOptions(false)}
            >
              <Text style={[styles.modalOptionText, styles.modalCancelText]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Premium View Photo Modal */}
      <Modal
        visible={showViewPhotoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewPhotoModal(false)}
      >
        <TouchableOpacity
          style={styles.viewPhotoOverlay}
          activeOpacity={1}
          onPress={() => setShowViewPhotoModal(false)}
        >
          <View style={styles.viewPhotoContainer}>
            <TouchableOpacity
              style={styles.closeViewPhotoBtn}
              onPress={() => setShowViewPhotoModal(false)}
            >
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {photoUri && (
              <Image
                source={{ uri: photoUri }}
                style={styles.viewPhotoSquare}
                resizeMode="cover"
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 130, // Espaço maior para a barra inferior que subiu
    paddingHorizontal: 16,
    paddingTop: 16,
    flexGrow: 1,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  photoContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  photoPlaceholder: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  personIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alterarFotoText: {
    fontSize: 16,
    color: '#042A7D',
    fontWeight: 'bold',
  },
  topFields: {
    flex: 1,
    gap: 10,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C2434',
  },
  textInputBox: {
    backgroundColor: '#E3E4EB',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  input: {
    fontSize: 14,
    color: '#1C2434',
  },
  infoRow: {
    marginBottom: 15,
  },
  infoBox: {
    backgroundColor: '#E3E4EB',
    borderRadius: 10,
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#767676',
  },
  alterarLink: {
    fontSize: 14,
    color: '#042A7D',
    fontWeight: 'bold',
  },
  addressCard: {
    backgroundColor: '#1C2434',
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addressTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  enviarBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enviarBtnActive: {
    backgroundColor: '#25BE36',
  },
  enviarBtnConfirmed: {
    backgroundColor: '#25BE36', // Mantém a mesma cor de fundo verde
  },
  enviarBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addressInputBoxError: {
    borderColor: '#FF3B30',
    borderWidth: 1.0,
  },
  addressErrorText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  addressFieldGroup: {
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 5,
  },
  addressInputBox: {
    backgroundColor: '#E3E4EB',
    borderRadius: 8,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  addressInput: {
    flex: 1,
    fontSize: 13,
    color: '#1C2434',
  },
  alterarLinkAddr: {
    fontSize: 13,
    color: '#042A7D',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  row: {
    flexDirection: 'row',
  },
  obsText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
    lineHeight: 24,
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
  profilePhoto: {
    width: 110,
    height: 110,
    borderRadius: 20,
  },
  // ===== MODAL IMAGE PICKER (IDENTICO AO ADMIN) =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAEAEA',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#D4D4D4',
    fontWeight: '500',
  },
  modalCancelText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#333333',
    width: '100%',
  },

  // ===== AUTOCOMPLETE ENDEREÇO =====
  suggestionsDropdown: {
    backgroundColor: '#2A3444',
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 160,
    paddingVertical: 4,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A4454',
  },
  suggestionText: {
    fontSize: 13,
    color: '#E0E0E0',
  },
  // ===== WHITE MODALS =====
  whiteModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  whiteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C2434',
    marginBottom: 8,
    textAlign: 'center',
  },
  whiteModalDesc: {
    fontSize: 14,
    color: '#767676',
    textAlign: 'center',
    marginBottom: 16,
  },
  whiteModalInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    fontSize: 16,
    color: '#1C2434',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputSuccess: {
    borderColor: '#00C853',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  usernameSuccessMsg: {
    color: '#00C853',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  usernameErrorMsg: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  suggestionsContainer: {
    marginTop: 10,
  },
  suggestionsTitle: {
    fontSize: 13,
    color: '#767676',
    marginBottom: 6,
  },
  suggestionBadge: {
    backgroundColor: '#E3E4EB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  suggestionBadgeText: {
    color: '#1C2434',
    fontSize: 14,
    fontWeight: '500',
  },
  whiteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 10,
  },
  whiteModalBtnCancel: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  whiteModalBtnTextCancel: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 15,
  },
  whiteModalBtnConfirm: {
    flex: 1,
    backgroundColor: '#042A7D',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  whiteModalBtnTextConfirm: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  viewPhotoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewPhotoContainer: {
    width: '80%',
    aspectRatio: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  viewPhotoSquare: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  closeViewPhotoBtn: {
    position: 'absolute',
    top: -45,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
});
