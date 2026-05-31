import { useState, useEffect, useRef } from 'react';
import { Alert, Keyboard } from 'react-native';
import MapView from 'react-native-maps';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useTheme } from '../../../contexts/ThemeContext';

export const DEFAULT_STORE_LOCATION = {
  latitude: -21.9765, longitude: -45.3469,
  latitudeDelta: 0.005, longitudeDelta: 0.005,
};

export const isNightTime = () => { const h = new Date().getHours(); return h >= 18 || h < 6; };

export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

export function useAdminMapScreen() {
  const mapRef = useRef<MapView>(null);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme();

  const [storeLocation, setStoreLocation] = useState(DEFAULT_STORE_LOCATION);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<any>(null);
  const [trackedClient, setTrackedClient] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [remainingRoute, setRemainingRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const [carPosition, setCarPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [hasArrived, setHasArrived] = useState(false);
  const [showCar, setShowCar] = useState(true);
  const [deliveryRadius, setDeliveryRadius] = useState(17);

  const routeIndexRef = useRef(0);
  const carAnimationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideCarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStoreLocation = async () => {
    try {
      const { data, error } = await supabase.from('agropet_store_location').select('latitude, longitude').eq('id', 1).single();
      /* istanbul ignore next */
      if (data && !error) setStoreLocation({ ...DEFAULT_STORE_LOCATION, latitude: data.latitude, longitude: data.longitude });
    } catch (e) { /* ignore */ }
  };

  const fetchRadius = async () => {
    try {
      const { data, error } = await supabase.from('store_settings').select('delivery_radius_km').maybeSingle();
      setDeliveryRadius(data && !error && data.delivery_radius_km !== null ? data.delivery_radius_km : 17);
    } catch (e) { setDeliveryRadius(17); }
  };

  useEffect(() => { fetchStoreLocation(); fetchRadius(); }, []);

  /* istanbul ignore next */
  const animateCarTo = (
    startCoord: { latitude: number; longitude: number },
    endCoord: { latitude: number; longitude: number },
    duration: number, onFinished?: () => void
  ) => {
    const steps = Math.round(duration / 50);
    let currentStep = 0;
    if (carAnimationIntervalRef.current) clearInterval(carAnimationIntervalRef.current);
    if (steps <= 0) { setCarPosition(endCoord); if (onFinished) onFinished(); return; }
    carAnimationIntervalRef.current = setInterval(() => {
      currentStep += 1;
      if (currentStep >= steps) {
        clearInterval(carAnimationIntervalRef.current!);
        carAnimationIntervalRef.current = null;
        setCarPosition(endCoord);
        if (onFinished) onFinished();
        return;
      }
      const ratio = currentStep / steps;
      setCarPosition({
        latitude: startCoord.latitude + (endCoord.latitude - startCoord.latitude) * ratio,
        longitude: startCoord.longitude + (endCoord.longitude - startCoord.longitude) * ratio,
      });
    }, 50);
  };

  /* istanbul ignore next */
  const startTracking = (coords: { latitude: number; longitude: number }[], startTime: number, clientLoc?: any) => {
    setIsTracking(true); setHasArrived(false); setShowCar(true); routeIndexRef.current = 0;
    if (trackingTimeoutRef.current) clearTimeout(trackingTimeoutRef.current);
    if (carAnimationIntervalRef.current) clearInterval(carAnimationIntervalRef.current);
    if (hideCarTimeoutRef.current) clearTimeout(hideCarTimeoutRef.current);

    const moveToNextStep = () => {
      const totalPoints = coords.length;
      const elapsedMs = Date.now() - startTime;
      const stepDuration = 1500;
      const expectedIndex = Math.floor(elapsedMs / stepDuration);

      if (expectedIndex >= totalPoints || routeIndexRef.current >= totalPoints - 1) {
        const currentPos = carPosition || coords[routeIndexRef.current];
        const lastIndex = coords.length - 1;
        if (lastIndex > 0) {
          const sC = coords[lastIndex - 1], eC = coords[lastIndex];
          if (eC.longitude !== sC.longitude) setFacingRight(eC.longitude > sC.longitude);
        }
        animateCarTo(currentPos, coords[totalPoints - 1], 500, async () => {
          setIsTracking(false); setRemainingRoute([]); setHasArrived(true);
          if (clientLoc?.orderId) {
            try {
              const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', clientLoc.orderId);
              if (error) console.error('Erro ao atualizar status do pedido:', error);
            } catch (err) { console.error('Erro ao atualizar status do pedido:', err); }
          }
          if (hideCarTimeoutRef.current) clearTimeout(hideCarTimeoutRef.current);
          hideCarTimeoutRef.current = setTimeout(() => setShowCar(false), 60000);
        });
        return;
      }

      const currentIndex = routeIndexRef.current;
      if (expectedIndex - currentIndex > 5) {
        const skipIndex = expectedIndex - 5;
        routeIndexRef.current = skipIndex;
        if (skipIndex > 0) {
          const sC = coords[skipIndex - 1], eC = coords[skipIndex];
          if (eC.longitude !== sC.longitude) setFacingRight(eC.longitude > sC.longitude);
        }
        setCarPosition(coords[skipIndex]);
        setRemainingRoute(coords.slice(skipIndex));
        trackingTimeoutRef.current = setTimeout(() => moveToNextStep(), 50);
        return;
      }

      const nextIndex = currentIndex + 1;
      routeIndexRef.current = nextIndex;
      setRemainingRoute(coords.slice(nextIndex));
      const sC = coords[currentIndex], eC = coords[nextIndex];
      if (sC && eC && eC.longitude !== sC.longitude) setFacingRight(eC.longitude > sC.longitude);
      if (sC && eC) {
        animateCarTo(sC, eC, nextIndex < expectedIndex ? 150 : stepDuration, () => {
          trackingTimeoutRef.current = setTimeout(() => moveToNextStep(), 10);
        });
      } else {
        trackingTimeoutRef.current = setTimeout(() => moveToNextStep(), 10);
      }
    };
    moveToNextStep();
  };

  /* istanbul ignore next */
  const fetchRouteAndStartTracking = async (storeLoc: any, clientLoc: any) => {
    try {
      const origin = `${storeLoc.longitude},${storeLoc.latitude}`;
      const destination = `${clientLoc.longitude},${clientLoc.latitude}`;
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin};${destination}?overview=full&geometries=geojson`);
      const data = await response.json();
      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates.map((coord: any) => ({ latitude: coord[1], longitude: coord[0] }));
        setRouteCoordinates(coords);
        setRemainingRoute(coords);
        setCarPosition(coords[0]);
        routeIndexRef.current = 0;
        startTracking(coords, Date.now(), clientLoc);
      }
    } catch (err) { console.error('Erro ao buscar rota:', err); }
  };

  /* istanbul ignore next */
  const fetchLocations = async (query: string) => {
    try {
      setIsSearching(true);
      const queryWithCity = `${query}, Lambari, Minas Gerais, Brasil`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithCity)}&limit=5&countrycodes=br`,
        { headers: { 'User-Agent': 'AgropetAppAdmin/1.0', 'Accept-Language': 'pt-BR,pt;q=0.9' } }
      );
      const text = await response.text();
      try { setSuggestions(JSON.parse(text)); } catch (e) { console.error('JSON error:', text); }
    } catch (error) { console.error('Erro ao buscar local', error); }
    finally { setIsSearching(false); }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchQuery.trim().length > 2) fetchLocations(searchQuery); else setSuggestions([]);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  /* istanbul ignore next */
  const handleSelectLocation = (loc: any) => {
    Keyboard.dismiss(); setSearchQuery(''); setSuggestions([]);
    const lat = parseFloat(loc.lat), lon = parseFloat(loc.lon);
    const name = loc.name || loc.display_name.split(',')[0];
    setSearchedLocation({ latitude: lat, longitude: lon, title: name, description: loc.display_name });
    if (mapRef.current) mapRef.current.animateToRegion({ latitude: lat, longitude: lon, latitudeDelta: 0.01, longitudeDelta: 0.01 });
  };

  useEffect(() => {
    let currentStoreLoc = storeLocation;
    /* istanbul ignore next */
    const loadAndTrack = async () => {
      fetchRadius();
      try {
        const { data, error } = await supabase.from('agropet_store_location').select('latitude, longitude').eq('id', 1).single();
        if (data && !error) { currentStoreLoc = { ...DEFAULT_STORE_LOCATION, latitude: data.latitude, longitude: data.longitude }; setStoreLocation(currentStoreLoc); }
      } catch (e) { console.log('Error loading store location on focus:', e); }
      
      const params = route.params;
      if (params?.clientLocation) {
        const clientLoc = params.clientLocation;
        setTrackedClient(clientLoc);
        if (mapRef.current) mapRef.current.animateToRegion({ latitude: clientLoc.latitude, longitude: clientLoc.longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 1000);
        fetchRouteAndStartTracking(currentStoreLoc, clientLoc);
      } else { setTrackedClient(null); }
    };
    loadAndTrack();
  }, [route.params?.clientLocation]);

  useEffect(() => {
    const unsubBlur = navigation.addListener('blur', () => {
      setTrackedClient(null); setRouteCoordinates([]); setRemainingRoute([]); setCarPosition(null);
      setIsTracking(false); setHasArrived(false); setShowCar(true);
      if (carAnimationIntervalRef.current) { clearInterval(carAnimationIntervalRef.current); carAnimationIntervalRef.current = null; }
      if (trackingTimeoutRef.current) { clearTimeout(trackingTimeoutRef.current); trackingTimeoutRef.current = null; }
      if (hideCarTimeoutRef.current) { clearTimeout(hideCarTimeoutRef.current); hideCarTimeoutRef.current = null; }
      navigation.setParams({ clientLocation: null });
    });
    return unsubBlur;
  }, [navigation]);

  useEffect(() => {
    return () => {
      /* istanbul ignore next */
      if (carAnimationIntervalRef.current) clearInterval(carAnimationIntervalRef.current);
      /* istanbul ignore next */
      if (trackingTimeoutRef.current) clearTimeout(trackingTimeoutRef.current);
      /* istanbul ignore next */
      if (hideCarTimeoutRef.current) clearTimeout(hideCarTimeoutRef.current);
    };
  }, []);

  /* istanbul ignore next */
  const handleGoBackFromTracking = () => {
    if (carAnimationIntervalRef.current) { clearInterval(carAnimationIntervalRef.current); carAnimationIntervalRef.current = null; }
    if (trackingTimeoutRef.current) { clearTimeout(trackingTimeoutRef.current); trackingTimeoutRef.current = null; }
    if (hideCarTimeoutRef.current) { clearTimeout(hideCarTimeoutRef.current); hideCarTimeoutRef.current = null; }
    setTrackedClient(null); setRouteCoordinates([]); setRemainingRoute([]); setCarPosition(null);
    setIsTracking(false); setHasArrived(false); setShowCar(true);
    navigation.setParams({ clientLocation: null });
    navigation.goBack();
  };

  /* istanbul ignore next */
  const handleMarkerDragEnd = async (e: any) => {
    if (!isEditingLocation) return;
    const nc = e.nativeEvent.coordinate;
    try {
      const { error } = await supabase.from('agropet_store_location').upsert({ id: 1, latitude: nc.latitude, longitude: nc.longitude });
      if (!error) { setStoreLocation({ ...storeLocation, latitude: nc.latitude, longitude: nc.longitude }); setIsEditingLocation(false); Alert.alert('Sucesso', 'Localização da loja atualizada com sucesso!'); }
      else Alert.alert('Erro', 'Falha ao salvar a nova localização.');
    } catch (err) { Alert.alert('Erro', 'Erro de conexão.'); }
  };

  /* istanbul ignore next */
  const handleSetStoreLocation = () => {
    if (isEditingLocation) { setIsEditingLocation(false); return; }
    Alert.alert('Mudar Localização', 'Tem certeza que deseja mudar a localização da loja?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quero mudar', onPress: () => { setIsEditingLocation(true); Alert.alert('Modo Edição', 'Segure e arraste o pino vermelho no mapa para o novo local!'); } }
    ]);
  };

  return {
    colors, isDarkMode, navigation, mapRef, route,
    storeLocation, isEditingLocation, searchQuery, setSearchQuery,
    suggestions, isSearching, searchedLocation,
    trackedClient, routeCoordinates, remainingRoute,
    carPosition, isTracking, facingRight, hasArrived, showCar, deliveryRadius,
    handleSelectLocation, handleGoBackFromTracking, handleMarkerDragEnd, handleSetStoreLocation,
    setIsEditingLocation, animateCarTo,
  };
}
