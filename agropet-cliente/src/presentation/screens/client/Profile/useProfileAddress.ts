import React, { useState } from 'react';
import { Alert, Animated, TextInput, Keyboard } from 'react-native';
import { supabase } from '../../../../data/datasources/supabase/client';
import { getDistanceKm, nominatimSearch, fetchStoreLocation, fetchDeliveryRadius } from './geolocation';

export function useProfileAddress({
  user, navigation, profileLoadedRef, setNome, setUsuario, setEmail, setPhone, setPhoneStatus,
}: {
  user: any; navigation: any; profileLoadedRef: React.MutableRefObject<boolean>;
  setNome: React.Dispatch<React.SetStateAction<string>>;
  setUsuario: React.Dispatch<React.SetStateAction<string>>;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  setPhone: React.Dispatch<React.SetStateAction<string>>;
  setPhoneStatus: React.Dispatch<React.SetStateAction<'cadastrar' | 'validar' | 'alterar'>>;
}) {
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

  const addressErrorOpacity = React.useRef(new Animated.Value(0)).current;
  const errorTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const ruaRef = React.useRef<TextInput>(null);
  const bairroRef = React.useRef<TextInput>(null);
  const cepRef = React.useRef<TextInput>(null);
  const numeroRef = React.useRef<TextInput>(null);
  const autoValidatingRef = React.useRef(false);
  const lastAttemptedAddressRef = React.useRef('');

  const triggerAddressError = React.useCallback(() => {
    if (errorTimeoutRef.current) { clearTimeout(errorTimeoutRef.current); errorTimeoutRef.current = null; }
    setShowAddressValidationErrors(true);
    Animated.timing(addressErrorOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    errorTimeoutRef.current = setTimeout(() => {
      Animated.timing(addressErrorOpacity, { toValue: 0, duration: 400, useNativeDriver: true })
        .start(({ finished }: any) => { if (finished) setShowAddressValidationErrors(false); });
    }, 8000);
  }, [addressErrorOpacity]);

  React.useEffect(() => {
    return () => { if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current); };
  }, []);

  React.useEffect(() => { if (profileLoadedRef.current) setLocationConfirmed(false); }, [rua, bairro, cep, numero]);

  const fetchDeliveryStatus = async () => {
    try {
      const { data, error } = await supabase.from('store_settings').select('delivery_active').maybeSingle();
      if (data && !error && data.delivery_active !== undefined) {
        setDeliveryActive(data.delivery_active);
        if (typeof (global as any).refreshDeliveryTabs === 'function') (global as any).refreshDeliveryTabs();
      }
    } catch (e) { console.log('Error fetching delivery active in profile:', e); }
  };

  const fetchProfile = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase.from('users')
        .select('name, username, email, phone, rua, bairro, cep, numero, lat, lng, location_confirmed')
        .eq('id', user.id).single();
      if (data) {
        setNome(data.name || '');
        setUsuario(data.username || '');
        setEmail(data.email || user.email || '');
        setPhone(data.phone || '');
        if (data.phone) setPhoneStatus('alterar');
        profileLoadedRef.current = false;
        setRua(data.rua || ''); setBairro(data.bairro || ''); setCep(data.cep || ''); setNumero(data.numero || '');
        if (data.lat && data.lng) { setLat(data.lat); setLng(data.lng); } else { setLat(null); setLng(null); }
        setLocationConfirmed(data.location_confirmed || false);
        const hasAny = data.rua || data.bairro || data.cep || data.numero;
        const hasEmpty = !data.rua || !data.bairro || !data.cep || !data.numero;
        if (hasAny && hasEmpty) { setShowAddressValidationErrors(true); } else { setShowAddressValidationErrors(false); }
        setTimeout(() => { profileLoadedRef.current = true; }, 150);
      }
    } catch (err) { console.log('Erro ao carregar perfil', err); }
  };

  React.useEffect(() => { fetchDeliveryStatus();
    const channel = supabase.channel('store_settings_profile_tabs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, (payload) => {
        if (payload.new && (payload.new as any).delivery_active !== undefined) {
          setDeliveryActive((payload.new as any).delivery_active);
          if (typeof (global as any).refreshDeliveryTabs === 'function') (global as any).refreshDeliveryTabs();
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  React.useEffect(() => { fetchProfile(); }, [user?.id]);

  const autoValidateAddressIfPossible = async (cRua: string, cBairro: string, cCep: string, cNumero: string) => {
    if (!user || autoValidatingRef.current || !deliveryActive || locationConfirmed) return;
    if (!cRua.trim() || !cBairro.trim() || !cCep.trim() || !cNumero.trim()) return;
    autoValidatingRef.current = true;
    try {
      let rLat: number | null = null, rLng: number | null = null;
      const data1 = await nominatimSearch(`${cRua}, ${cNumero}, ${cBairro}, Lambari, Minas Gerais, Brasil`);
      if (data1?.length) { rLat = parseFloat(data1[0].lat); rLng = parseFloat(data1[0].lon); }
      else {
        const data2 = await nominatimSearch(`${cRua}, ${cBairro}, Lambari, Minas Gerais, Brasil`);
        if (data2?.length) { rLat = parseFloat(data2[0].lat); rLng = parseFloat(data2[0].lon); }
      }
      if (rLat && rLng) {
        const { storeLat, storeLng } = await fetchStoreLocation();
        const maxRadius = await fetchDeliveryRadius();
        if (getDistanceKm(storeLat, storeLng, rLat, rLng) > maxRadius) return;
        const { error: ue } = await supabase.from('users').update({ lat: rLat, lng: rLng, location_confirmed: true }).eq('id', user.id);
        if (!ue) {
          setLat(rLat); setLng(rLng); setLocationConfirmed(true);
          Alert.alert('Oba! Frete Reativado 📍', 'Seu endereço foi localizado automaticamente no mapa agora que o frete está ativo!\n\nTodos os recursos de mapa, traçado de rotas e acompanhamento de pedidos foram liberados para você! 🏠🗺️',
            [{ text: 'Ver no Mapa', onPress: () => navigation.navigate('ClientTabs', { screen: 'Mapa' }) }, { text: 'OK' }]);
        }
      }
    } catch (err) { console.log('Erro na auto-validação de endereço:', err); }
    finally { autoValidatingRef.current = false; }
  };

  React.useEffect(() => {
    if (deliveryActive && profileLoadedRef.current && !locationConfirmed) {
      if (rua.trim() && bairro.trim() && cep.trim() && numero.trim()) {
        const addrStr = `${rua.trim()}|${bairro.trim()}|${cep.trim()}|${numero.trim()}`;
        if (lastAttemptedAddressRef.current !== addrStr) {
          lastAttemptedAddressRef.current = addrStr;
          autoValidateAddressIfPossible(rua, bairro, cep, numero);
        }
      }
    } else if (!deliveryActive) {
      lastAttemptedAddressRef.current = '';
    }
  }, [deliveryActive, locationConfirmed, rua, bairro, cep, numero]);

  React.useEffect(() => {
    if (!user || !profileLoadedRef.current) return;
    const delay = setTimeout(() => {
      supabase.from('users').update({ rua, bairro, cep, numero, location_confirmed: locationConfirmed, lat, lng }).eq('id', user.id).then();
    }, 1000);
    return () => clearTimeout(delay);
  }, [rua, bairro, cep, numero, lat, lng, locationConfirmed, user]);

  React.useEffect(() => {
    const delay = setTimeout(() => {
      if (rua.trim().length > 2 && ruaRef.current?.isFocused()) { fetchAddressSuggestions(rua); }
      else { setAddressSuggestions([]); }
    }, 500);
    return () => clearTimeout(delay);
  }, [rua]);

  const fetchAddressSuggestions = async (query: string) => {
    try { setIsSearchingAddress(true); setAddressSuggestions(await nominatimSearch(`${query}, Lambari, Minas Gerais, Brasil`, 5)); }
    catch (error) { console.log('Erro ao buscar endereço'); }
    finally { setIsSearchingAddress(false); }
  };

  const handleSelectAddress = (item: any) => {
    Keyboard.dismiss(); setAddressSuggestions([]);
    const addr = item.address || {};
    const displayName = item.display_name || '';
    const parts = displayName.split(',').map((p: string) => p.trim());
    setRua(addr.road || addr.pedestrian || addr.footway || parts[0] || '');
    const bc = [addr.suburb, addr.neighbourhood, addr.quarter, addr.city_district, addr.village];
    let br = bc.find((b) => b && b.toLowerCase() !== 'lambari');
    if (!br) {
      const it = ['lambari', 'minas gerais', 'brasil', 'região', 'microrregião', 'mesorregião'];
      for (let i = 1; i < parts.length; i++) {
        const p = parts[i].toLowerCase();
        if (!it.some(inv => p.includes(inv)) && !/\d{5}-\d{3}/.test(p)) { br = parts[i]; break; }
      }
    }
    setBairro(br || '');
    let cp = addr.postcode || '';
    if (!cp) { const m = displayName.match(/\d{5}-\d{3}/); if (m) cp = m[0]; }
    setCep(cp); setNumero(addr.house_number || '');
    if (item.lat && item.lon) { setLat(parseFloat(item.lat)); setLng(parseFloat(item.lon)); }
  };

  const saveAddressToDB = async (rLat: number | null, rLng: number | null, confirmLocation: boolean) => {
    if (!user) return;
    if (rLat && rLng && confirmLocation) {
      const { storeLat, storeLng } = await fetchStoreLocation();
      if (getDistanceKm(storeLat, storeLng, rLat, rLng) > await fetchDeliveryRadius()) {
        Alert.alert('Fora da Área de Entrega', 'Infelizmente nossos serviços de frete não alcançam essa área. Obrigado pela compreensão.');
        return;
      }
    }
    const ud: any = { rua, bairro, cep, numero, location_confirmed: confirmLocation };
    if (rLat && rLng) { ud.lat = rLat; ud.lng = rLng; }
    const { error } = await supabase.from('users').update(ud).eq('id', user.id);
    if (error) { Alert.alert('Erro', 'Não foi possível salvar o endereço.'); }
    else {
      setLocationConfirmed(confirmLocation); setShowAddressValidationErrors(false);
      if (confirmLocation) {
        Alert.alert('Endereço Enviado!', 'Seu endereço foi salvo com sucesso e sua localização foi confirmada no mapa! 📍\n\nParabéns! Você desbloqueou novos recursos em seu mapa:\n• Ponto exato da sua casa demarcado 🏠\n• Opção de focar/mirar na sua casa 🎯\n• Roteirização/Traçado de rotas 🗺️\n• Legenda completa dos status de entrega',
          [{ text: 'Ver no Mapa', onPress: () => navigation.navigate('ClientTabs', { screen: 'Mapa' }) }, { text: 'OK' }]);
      } else { Alert.alert('Sucesso', 'Endereço salvo com sucesso.'); }
    }
  };

  const handleSendAddress = async () => {
    if (!rua.trim() || !bairro.trim() || !cep.trim() || !numero.trim()) { triggerAddressError(); return; }
    try {
      setIsSearchingAddress(true);
      const { data: settings, error: se } = await supabase.from('store_settings').select('delivery_active').maybeSingle();
      if (settings && !se && settings.delivery_active === false) {
        if (user) {
          const { error: ue } = await supabase.from('users').update({ rua, bairro, cep, numero, lat: null, lng: null, location_confirmed: false }).eq('id', user.id);
          if (ue) { Alert.alert('Erro', 'Não foi possível salvar o endereço.'); }
          else { setLat(null); setLng(null); setLocationConfirmed(false);
            Alert.alert('Sucesso', 'Suas informações foram registradas com sucesso! Porém não é possível registrar sua localização no mapa pois o frete encontra-se inativo no momento. Quando voltarmos da manutenção do veículo, você já terá todas as funcionalidades do mapa ativo. Não se preocupe! Voltaremos em breve!'); }
        }
        return;
      }
      let cLat = lat, cLng = lng;
      const d1 = await nominatimSearch(`${rua}, ${numero}, ${bairro}, Lambari, Minas Gerais, Brasil`);
      if (d1?.length) { cLat = parseFloat(d1[0].lat); cLng = parseFloat(d1[0].lon); setLat(cLat); setLng(cLng); }
      else {
        const d2 = await nominatimSearch(`${rua}, ${bairro}, Lambari, Minas Gerais, Brasil`);
        if (d2?.length) { cLat = parseFloat(d2[0].lat); cLng = parseFloat(d2[0].lon); setLat(cLat); setLng(cLng); }
      }
      if (!cLat || !cLng) {
        Alert.alert('Endereço não localizado', 'Não conseguimos encontrar as coordenadas exatas deste endereço no mapa. Deseja salvar mesmo assim?',
          [{ text: 'Cancelar', style: 'cancel' }, { text: 'Salvar mesmo assim', onPress: async () => { await saveAddressToDB(null, null, false); } }]);
        return;
      }
      await saveAddressToDB(cLat, cLng, true);
    } catch (err) { console.log('Erro ao buscar coordenadas no Enviar', err); await saveAddressToDB(lat, lng, true); }
    finally { setIsSearchingAddress(false); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchDeliveryStatus()]);
    setRefreshing(false);
  };

  return {
    rua, setRua, bairro, setBairro, cep, setCep, numero, setNumero,
    lat, setLat, lng, setLng,
    addressSuggestions, setAddressSuggestions,
    isSearchingAddress,
    locationConfirmed, setLocationConfirmed,
    showAddressValidationErrors,
    deliveryActive,
    refreshing,
    firstEmptyField,
    addressErrorOpacity,
    ruaRef, bairroRef, cepRef, numeroRef,
    handleRefresh,
    triggerAddressError,
    fetchAddressSuggestions,
    handleSelectAddress,
    handleSendAddress,
  };
}
