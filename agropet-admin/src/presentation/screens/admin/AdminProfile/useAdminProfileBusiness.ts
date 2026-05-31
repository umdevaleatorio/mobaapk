import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Alert,
  Animated,
  TextInput,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../../data/datasources/supabase/client';

export function useAdminProfileBusiness(user: any, profileLoadedRef: React.MutableRefObject<boolean>) {
  const navigation = useNavigation<any>();

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

  const firstEmptyField = (() => {
    if (!rua.trim()) return 'rua';
    if (!bairro.trim()) return 'bairro';
    if (!cep.trim()) return 'cep';
    if (!numero.trim()) return 'numero';
    return null;
  })();

  const addressErrorOpacity = useRef(new Animated.Value(0)).current;
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAddressError = useCallback(() => {
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

  const ruaRef = useRef<TextInput>(null);
  const bairroRef = useRef<TextInput>(null);
  const cepRef = useRef<TextInput>(null);
  const numeroRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (profileLoadedRef.current) {
      setLocationConfirmed(false);
    }
  }, [rua, bairro, cep, numero]);

  useEffect(() => {
    if (!user || !profileLoadedRef.current) return;
    const delay = setTimeout(() => {
      const updateData: any = {
        rua,
        bairro,
        cep,
        numero,
        location_confirmed: locationConfirmed,
        lat,
        lng,
      };
      supabase.from('users').update(updateData).eq('id', user.id).then();
    }, 1000);
    return () => clearTimeout(delay);
  }, [rua, bairro, cep, numero, lat, lng, locationConfirmed, user]);

  useEffect(() => {
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

    setRua(addr.road || addr.pedestrian || addr.footway || parts[0] || '');

    const bairroCandidates = [addr.suburb, addr.neighbourhood, addr.quarter, addr.city_district, addr.village];
    let bairroResult = bairroCandidates.find((b) => b && b.toLowerCase() !== 'lambari');

    if (!bairroResult) {
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

    let cepResult = addr.postcode || '';
    if (!cepResult) {
      const cepMatch = displayName.match(/\d{5}-\d{3}/);
      if (cepMatch) cepResult = cepMatch[0];
    }
    setCep(cepResult);

    setNumero(addr.house_number || '');

    if (item.lat && item.lon) {
      setLat(parseFloat(item.lat));
      setLng(parseFloat(item.lon));
    }
  };

  const saveAddressToDB = async (resolvedLat: number | null, resolvedLng: number | null, confirmLocation: boolean) => {
    if (!user) return;

    const updateData: any = {
      rua,
      bairro,
      cep,
      numero,
      location_confirmed: confirmLocation,
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

      if (resolvedLat && resolvedLng && confirmLocation) {
        try {
          await supabase.from('agropet_store_location').upsert({
            id: 1,
            latitude: resolvedLat,
            longitude: resolvedLng,
            address: `${rua}, ${numero} - ${bairro}, ${cep}`,
          });
        } catch (e) {
          console.log('Error upserting store location:', e);
        }
      }

      if (confirmLocation) {
        Alert.alert(
          'Endereço da Loja Enviado!',
          'O endereço da sua loja foi salvo com sucesso e a localização foi confirmada no mapa! 📍\n\nAgora o pino da loja no mapa foi atualizado automaticamente para o novo local.',
          [
            {
              text: 'Ver no Mapa',
              onPress: () => {
                navigation.navigate('AdminTabs', { screen: 'Mapa' });
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

  const handleSendAddress = async () => {
    if (!rua.trim() || !bairro.trim() || !cep.trim() || !numero.trim()) {
      triggerAddressError();
      return;
    }

    try {
      setIsSearchingAddress(true);

      let currentLat = lat;
      let currentLng = lng;

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
      await saveAddressToDB(lat, lng, true);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  return {
    rua, setRua, bairro, setBairro, cep, setCep, numero, setNumero,
    lat, setLat, lng, setLng,
    addressSuggestions, setAddressSuggestions,
    isSearchingAddress,
    locationConfirmed, setLocationConfirmed,
    showAddressValidationErrors,
    firstEmptyField,
    addressErrorOpacity,
    ruaRef, bairroRef, cepRef, numeroRef,
    triggerAddressError,
    fetchAddressSuggestions,
    handleSelectAddress,
    handleSendAddress,
  };
}
