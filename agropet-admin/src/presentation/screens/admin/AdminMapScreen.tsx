import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  Keyboard,
  Alert,
  Animated,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Svg, { Circle, Line, Path, Defs, LinearGradient, Stop, Rect, G, Ellipse } from 'react-native-svg';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { supabase } from '../../../data/datasources/supabase/client';
import { useRoute, useNavigation } from '@react-navigation/native';

// LupaIcon (or simple search bar icon)
import LupaIcon from '../../assets/tela7/parte superior/Adicionar/Remover/Barra de Pesquisa.svg';

const DEFAULT_STORE_LOCATION = {
  latitude: -21.9765,
  longitude: -45.3469,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

// Componente de pino para a legenda
const LegendPin = ({ color }: { color: string }) => (
  <Svg width="20" height="24" viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </Svg>
);

// Ícone de Fiorino estilizado e animado (salto e deformação elástica ao virar)
const FiorinoIcon = ({ facingRight = true }: { facingRight?: boolean }) => {
  const jumpValue = useRef(new Animated.Value(0)).current;
  const scaleYValue = useRef(new Animated.Value(1)).current;
  const prevFacingRight = useRef(facingRight);

  useEffect(() => {
    // Só anima se a direção REALMENTE mudou
    if (prevFacingRight.current !== facingRight) {
      prevFacingRight.current = facingRight;

      // Executa sequência elástica de pulo e esmagamento (Squash/Stretch)
      Animated.sequence([
        // 1. Preparação: Encolhe ligeiramente no chão antes do impulso (50ms)
        Animated.timing(scaleYValue, {
          toValue: 0.82,
          duration: 50,
          useNativeDriver: true,
        }),
        // 2. Subida: Pula para cima e estica verticalmente (120ms)
        Animated.parallel([
          Animated.timing(jumpValue, {
            toValue: -14, // Altura do pulo
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(scaleYValue, {
            toValue: 1.18, // Esticamento
            duration: 120,
            useNativeDriver: true,
          }),
        ]),
        // 3. Queda e impacto: Volta ao chão e se achata (160ms)
        Animated.parallel([
          Animated.spring(jumpValue, {
            toValue: 0,
            friction: 5,
            tension: 60,
            useNativeDriver: true,
          }),
          Animated.sequence([
            // Esmaga ao tocar o chão
            Animated.timing(scaleYValue, {
              toValue: 0.78,
              duration: 80,
              useNativeDriver: true,
            }),
            // Recupera a forma original gradualmente com mola
            Animated.spring(scaleYValue, {
              toValue: 1,
              friction: 3,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }
  }, [facingRight]);

  return (
    <Animated.View style={{
      width: 48,
      height: 34,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      borderWidth: 2,
      borderColor: '#4CAF50', // Verde Agropet
      padding: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 3.5,
      elevation: 6,
      transform: [
        { translateY: jumpValue },
        { scaleY: scaleYValue },
        { scaleX: facingRight ? 1 : -1 }
      ],
    }}>
      <Svg width="40" height="26" viewBox="0 0 40 26" fill="none">
        {/* Sombra interna projetada */}
        <Ellipse cx="20" cy="24" rx="16" ry="2" fill="rgba(0, 0, 0, 0.15)" />

        {/* Corpo Traseiro (Baú) */}
        <Path
          d="M2 3C2 1.89543 2.89543 1 4 1H22C23.1046 1 24 1.89543 24 3V18H2V3Z"
          fill="#EEEEEE"
        />
        
        {/* Detalhe superior do Baú */}
        <Path
          d="M4 2H22V6H4V2Z"
          fill="#F9F9F9"
        />

        {/* Adesivo Logo da Loja (AgroPet) */}
        <Rect x="6" y="5" width="12" height="9" rx="1.5" fill="#4CAF50" />
        {/* Desenho simplificado de patinha de pet */}
        <Circle cx="12" cy="10" r="2.5" fill="#FFFFFF" />
        <Circle cx="10" cy="8" r="0.8" fill="#FFFFFF" />
        <Circle cx="14" cy="8" r="0.8" fill="#FFFFFF" />
        <Circle cx="12" cy="7" r="0.8" fill="#FFFFFF" />

        {/* Cabine Dianteira */}
        <Path
          d="M24 6H29.5C31.1543 6 32.6974 6.78441 33.6569 8.1278L37.4831 13.0845C38.4586 14.4503 38.4005 16.2794 37.3414 17.5794L37 18H24V6Z"
          fill="#FFFFFF"
        />

        {/* Janela Lateral da Cabine */}
        <Path
          d="M25 8H29L32.5 13H25V8Z"
          fill="#1A3A6B"
        />
        {/* Reflexo do vidro */}
        <Path
          d="M26 9H28L30.5 12.5H29.5L27 9Z"
          fill="#4A90E2"
          opacity="0.6"
        />

        {/* Roda Traseira */}
        <Circle cx="9" cy="19" r="5" fill="#222" />
        <Circle cx="9" cy="19" r="3.5" fill="#555" />
        <Circle cx="9" cy="19" r="1.5" fill="#FFF" />

        {/* Roda Dianteira */}
        <Circle cx="28" cy="19" r="5" fill="#222" />
        <Circle cx="28" cy="19" r="3.5" fill="#555" />
        <Circle cx="28" cy="19" r="1.5" fill="#FFF" />

        {/* Farol Dianteiro */}
        <Path
          d="M36.5 13.5C37.5 13.5 38.5 14.5 38.5 15.5H35.5C35.5 14.5 36.5 13.5 36.5 13.5Z"
          fill="#FFD54F"
        />
        <Path
          d="M38.5 15.5L40 16.5L39 17.5L37.5 16.5L38.5 15.5Z"
          fill="#FFF9C4"
          opacity="0.8"
        />

        {/* Parachoque Traseiro */}
        <Path d="M1 18H4V20H1V18Z" fill="#333333" />
        
        {/* Parachoque Dianteiro */}
        <Path d="M33 18H37C37.5523 18 38 17.5523 38 17V16.5H32.5L33 18Z" fill="#333333" />
      </Svg>
    </Animated.View>
  );
};

export default function AdminMapScreen() {
  const mapRef = useRef<MapView>(null);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const [storeLocation, setStoreLocation] = useState(DEFAULT_STORE_LOCATION);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<any>(null);

  // Estados para o rastreamento do cliente
  const [trackedClient, setTrackedClient] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);

  // Estados para a simulação do carrinho (Fiorino)
  const [remainingRoute, setRemainingRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const [carPosition, setCarPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [hasArrived, setHasArrived] = useState(false);
  const [showCar, setShowCar] = useState(true);

  const routeIndexRef = useRef(0);
  const carAnimationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideCarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchStoreLocation();
  }, []);

  const fetchRouteAndStartTracking = async (storeLoc: any, clientLoc: any) => {
    try {
      const origin = `${storeLoc.longitude},${storeLoc.latitude}`;
      const destination = `${clientLoc.longitude},${clientLoc.latitude}`;
      const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin};${destination}?overview=full&geometries=geojson`);
      const data = await response.json();
      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates.map((coord: any) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setRouteCoordinates(coords);
        setRemainingRoute(coords);
        setCarPosition(coords[0]); // Começa na loja
        routeIndexRef.current = 0;

        // Inicia a animação/simulação do carrinho
        startTracking(coords, Date.now(), clientLoc);
      }
    } catch (err) {
      console.error('Erro ao buscar rota OSRM:', err);
    }
  };

  // Para suavizar o movimento do carro (deslizar)
  const animateCarTo = (
    startCoord: { latitude: number; longitude: number },
    endCoord: { latitude: number; longitude: number },
    duration: number,
    onFinished?: () => void
  ) => {
    const steps = Math.round(duration / 50); // 20fps
    let currentStep = 0;

    if (carAnimationIntervalRef.current) {
      clearInterval(carAnimationIntervalRef.current);
    }

    if (steps <= 0) {
      setCarPosition(endCoord);
      if (onFinished) onFinished();
      return;
    }

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
      const lat = startCoord.latitude + (endCoord.latitude - startCoord.latitude) * ratio;
      const lng = startCoord.longitude + (endCoord.longitude - startCoord.longitude) * ratio;
      setCarPosition({ latitude: lat, longitude: lng });
    }, 50);
  };

  // Simulação de rastreamento com catch-up e deslize suave
  const startTracking = (coords: { latitude: number; longitude: number }[], startTime: number, clientLoc?: any) => {
    setIsTracking(true);
    setHasArrived(false);
    setShowCar(true);
    routeIndexRef.current = 0;

    // Limpar timers anteriores
    if (trackingTimeoutRef.current) {
      clearTimeout(trackingTimeoutRef.current);
    }
    if (carAnimationIntervalRef.current) {
      clearInterval(carAnimationIntervalRef.current);
    }
    if (hideCarTimeoutRef.current) {
      clearTimeout(hideCarTimeoutRef.current);
    }

    const moveToNextStep = () => {
      const totalPoints = coords.length;
      const elapsedMs = Date.now() - startTime;
      
      const stepDuration = 1500; // 1.5s por ponto
      const expectedIndex = Math.floor(elapsedMs / stepDuration);

      if (expectedIndex >= totalPoints) {
        // Simulação concluída
        const currentPos = carPosition || coords[routeIndexRef.current];
        
        // Determina a direção final
        const lastIndex = coords.length - 1;
        if (lastIndex > 0) {
          const startC = coords[lastIndex - 1];
          const endC = coords[lastIndex];
          if (endC.longitude !== startC.longitude) {
            setFacingRight(endC.longitude > startC.longitude);
          }
        }

        animateCarTo(currentPos, coords[totalPoints - 1], 500, async () => {
          setIsTracking(false);
          setRemainingRoute([]);
          setHasArrived(true);

          if (clientLoc?.orderId) {
            try {
              const { error } = await supabase
                .from('orders')
                .update({ status: 'completed' })
                .eq('id', clientLoc.orderId);
              if (error) {
                console.error('Erro ao atualizar status do pedido para concluído:', error);
              } else {
                console.log('Pedido atualizado com sucesso para completed!');
              }
            } catch (err) {
              console.error('Erro ao atualizar status do pedido:', err);
            }
          }

          if (hideCarTimeoutRef.current) {
            clearTimeout(hideCarTimeoutRef.current);
          }
          hideCarTimeoutRef.current = setTimeout(() => {
            setShowCar(false);
          }, 60000); // 1 minuto
        });
        return;
      }

      const currentIndex = routeIndexRef.current;
      
      // Se a diferença de pontos é muito grande, pula
      if (expectedIndex - currentIndex > 5) {
        const skipIndex = expectedIndex - 5;
        routeIndexRef.current = skipIndex;
        
        if (skipIndex > 0) {
          const startC = coords[skipIndex - 1];
          const endC = coords[skipIndex];
          if (endC.longitude !== startC.longitude) {
            setFacingRight(endC.longitude > startC.longitude);
          }
        }

        setCarPosition(coords[skipIndex]);
        setRemainingRoute(coords.slice(skipIndex));
        trackingTimeoutRef.current = setTimeout(() => {
          moveToNextStep();
        }, 50);
        return;
      }

      const nextIndex = currentIndex + 1;
      routeIndexRef.current = nextIndex;
      setRemainingRoute(coords.slice(nextIndex));

      const startC = coords[currentIndex];
      const endC = coords[nextIndex];

      if (endC.longitude !== startC.longitude) {
        setFacingRight(endC.longitude > startC.longitude);
      }

      const isCatchingUp = nextIndex < expectedIndex;
      const duration = isCatchingUp ? 150 : stepDuration;

      animateCarTo(startC, endC, duration, () => {
        trackingTimeoutRef.current = setTimeout(() => {
          moveToNextStep();
        }, 10);
      });
    };

    // Iniciar loop de movimento
    moveToNextStep();
  };

  // Listener para capturar quando a tela é focada com parâmetros de rastreamento
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      const params = route.params;
      if (params?.clientLocation) {
        const clientLoc = params.clientLocation;
        setTrackedClient(clientLoc);
        
        // Anima o mapa para focar na casa do cliente
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: clientLoc.latitude,
            longitude: clientLoc.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }, 1000);
        }

        // Carrega a rota até a casa do cliente e inicia rastreio
        fetchRouteAndStartTracking(storeLocation, clientLoc);
      }
    });

    return unsubscribeFocus;
  }, [navigation, route.params, storeLocation]);

  // Listener para limpar parâmetros e estado quando perde o foco (blur)
  useEffect(() => {
    const unsubscribeBlur = navigation.addListener('blur', () => {
      setTrackedClient(null);
      setRouteCoordinates([]);
      setRemainingRoute([]);
      setCarPosition(null);
      setIsTracking(false);
      setHasArrived(false);
      setShowCar(true);
      if (carAnimationIntervalRef.current) {
        clearInterval(carAnimationIntervalRef.current);
        carAnimationIntervalRef.current = null;
      }
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
        trackingTimeoutRef.current = null;
      }
      if (hideCarTimeoutRef.current) {
        clearTimeout(hideCarTimeoutRef.current);
        hideCarTimeoutRef.current = null;
      }
      navigation.setParams({ clientLocation: null });
    });

    return unsubscribeBlur;
  }, [navigation]);

  // Limpar timers ao desmontar o componente
  useEffect(() => {
    return () => {
      if (carAnimationIntervalRef.current) {
        clearInterval(carAnimationIntervalRef.current);
      }
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }
      if (hideCarTimeoutRef.current) {
        clearTimeout(hideCarTimeoutRef.current);
      }
    };
  }, []);

  const fetchStoreLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('agropet_store_location')
        .select('latitude, longitude')
        .eq('id', 1)
        .single();
      
      if (data && !error) {
        setStoreLocation({
          ...DEFAULT_STORE_LOCATION,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    } catch (e) {
      console.log('Using default store location.');
    }
  };

  // Debounced search for Nominatim API
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        fetchLocations(searchQuery);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchLocations = async (query: string) => {
    try {
      setIsSearching(true);
      const queryWithCity = `${query}, Lambari, Minas Gerais, Brasil`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithCity)}&limit=5&countrycodes=br`,
        {
          headers: {
            'User-Agent': 'AgropetAppAdmin/1.0',
            'Accept-Language': 'pt-BR,pt;q=0.9',
          }
        }
      );
      
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        setSuggestions(data);
      } catch (e) {
        console.error('Erro de JSON do Nominatim:', text);
      }
    } catch (error) {
      console.error('Erro ao buscar local', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (loc: any) => {
    Keyboard.dismiss();
    setSearchQuery('');
    setSuggestions([]);
    
    const lat = parseFloat(loc.lat);
    const lon = parseFloat(loc.lon);
    
    const name = loc.name || loc.display_name.split(',')[0];
    setSearchedLocation({
      latitude: lat,
      longitude: lon,
      title: name,
      description: loc.display_name
    });

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#1C2434" barStyle="light-content" />

      {/* Header Admin */}
      <AdminHeader title="mapa" />

      {/* ========== MAPA (Google Maps) ========== */}
      <View style={styles.mapContainer}>
        {/* Floating Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar local..."
              placeholderTextColor="#919191"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          {/* Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
              {suggestions.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.suggestionItem}
                  onPress={() => handleSelectLocation(item)}
                >
                  <Text style={styles.suggestionText} numberOfLines={2}>{item.display_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={storeLocation}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* Pin da loja (Sempre visível e arrastável em modo de edição) */}
          <Marker
            draggable={isEditingLocation}
            onDragEnd={async (e) => {
              if (!isEditingLocation) return;
              const newCoordinate = e.nativeEvent.coordinate;
              
              try {
                const { error } = await supabase
                  .from('agropet_store_location')
                  .upsert({ id: 1, latitude: newCoordinate.latitude, longitude: newCoordinate.longitude });
                
                if (!error) {
                  setStoreLocation({ ...storeLocation, latitude: newCoordinate.latitude, longitude: newCoordinate.longitude });
                  setIsEditingLocation(false);
                  Alert.alert('Sucesso', 'Localização da loja atualizada com sucesso!');
                } else {
                  Alert.alert('Erro', 'Falha ao salvar a nova localização.');
                }
              } catch (err) {
                Alert.alert('Erro', 'Erro de conexão.');
              }
            }}
            coordinate={{
              latitude: storeLocation.latitude,
              longitude: storeLocation.longitude,
            }}
            title="Agropet Lambari"
            description="Av. João Bráulio Júnior, 290 - Volta do Lago, Lambari - MG, 37480-000"
          />
          
          {/* Pin do Cliente Sendo Rastreado */}
          {trackedClient && (
            <Marker
              coordinate={{
                latitude: trackedClient.latitude,
                longitude: trackedClient.longitude,
              }}
              title={trackedClient.name}
              description={trackedClient.address}
              pinColor="blue"
            />
          )}

          {/* Rota OSRM para Entrega em duas camadas (contorno preto + linha azul/escura) */}
          {(remainingRoute.length > 1 || (remainingRoute.length > 0 && carPosition)) && (
            <Polyline
              coordinates={carPosition ? [carPosition, ...remainingRoute] : remainingRoute}
              strokeColor="#000000"
              strokeWidth={8}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {(remainingRoute.length > 1 || (remainingRoute.length > 0 && carPosition)) && (
            <Polyline
              coordinates={carPosition ? [carPosition, ...remainingRoute] : remainingRoute}
              strokeColor="#1a3a6b"
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Marcador do Entregador (Fiorino estilizada da loja) */}
          {carPosition && showCar && (
            <Marker
              coordinate={carPosition}
              anchor={{ x: 0.5, y: 0.5 }}
              flat={true}
              title="Entregador"
            >
              <FiorinoIcon facingRight={facingRight} />
            </Marker>
          )}

          {/* Pin do Local Pesquisado */}
          {searchedLocation && (
            <Marker
              coordinate={{
                latitude: searchedLocation.latitude,
                longitude: searchedLocation.longitude,
              }}
              title={searchedLocation.title}
              description={searchedLocation.description}
              pinColor="blue"
            />
          )}
        </MapView>
        
        {/* Botão de Centralizar na Loja */}
        <TouchableOpacity 
          style={styles.recenterBtn}
          onPress={() => {
            if (mapRef.current) {
              mapRef.current.animateToRegion(storeLocation, 1000);
            }
          }}
        >
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1C2434" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="7" />
            <Circle cx="12" cy="12" r="2" fill="#1C2434" />
            <Line x1="12" y1="1" x2="12" y2="5" />
            <Line x1="12" y1="19" x2="12" y2="23" />
            <Line x1="1" y1="12" x2="5" y2="12" />
            <Line x1="19" y1="12" x2="23" y2="12" />
          </Svg>
        </TouchableOpacity>

        {/* Botão de Mira na Casa do Cliente ou Definir Nova Localização */}
        {trackedClient ? (
          <TouchableOpacity 
            style={[
              styles.setStoreBtn, 
              { 
                backgroundColor: 'transparent',
                borderWidth: 0,
                shadowColor: '#1a3a6b', 
                shadowOpacity: 0.6, 
                shadowRadius: 8, 
                elevation: 10,
              }
            ]}
            onPress={() => {
              if (mapRef.current && trackedClient) {
                mapRef.current.animateToRegion({
                  latitude: trackedClient.latitude,
                  longitude: trackedClient.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }, 1000);
              }
            }}
          >
            <Svg width="48" height="48" viewBox="0 0 48 48">
              <Defs>
                <LinearGradient id="clientGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#1a3a6b" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#000000" stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Rect width="48" height="48" rx="8" ry="8" fill="url(#clientGrad)" />
              <G x="12" y="12" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="12" cy="12" r="7" />
                <Circle cx="12" cy="12" r="2" fill="#FFFFFF" />
                <Line x1="12" y1="1" x2="12" y2="5" />
                <Line x1="12" y1="19" x2="12" y2="23" />
                <Line x1="1" y1="12" x2="5" y2="12" />
                <Line x1="19" y1="12" x2="23" y2="12" />
              </G>
            </Svg>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[
              styles.setStoreBtn,
              isEditingLocation && { backgroundColor: '#1C2434', borderColor: '#1C2434' }
            ]}
            onPress={() => {
              if (isEditingLocation) {
                setIsEditingLocation(false);
              } else {
                Alert.alert(
                  'Mudar Localização',
                  'Tem certeza que deseja mudar a localização da loja?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Quero mudar', onPress: () => {
                      setIsEditingLocation(true);
                      Alert.alert('Modo Edição', 'Segure e arraste o pino vermelho no mapa para o novo local!');
                    }}
                  ]
                );
              }
            }}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isEditingLocation ? "#FFFFFF" : "#1C2434"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <Circle cx="12" cy="10" r="3" />
            </Svg>
          </TouchableOpacity>
        )}

        {/* ========== LEGENDA ========== */}
        <View style={styles.legendBox}>
          {/* Ponto Vermelho - Loja */}
          <View style={styles.legendRow}>
            <View style={{ width: 24, alignItems: 'center' }}>
              <LegendPin color="#E53935" />
            </View>
            <Text style={styles.legendText}>Loja AgroPet</Text>
          </View>
          {/* Ponto Azul - Cliente */}
          <View style={styles.legendRow}>
            <View style={{ width: 24, alignItems: 'center' }}>
              <LegendPin color="#2196F3" />
            </View>
            <Text style={styles.legendText}>Cliente</Text>
          </View>
        </View>

        {/* Indicador de rastreamento ativo ou concluído */}
        {(isTracking || (hasArrived && showCar)) && (
          <View style={styles.trackingBadge}>
            <Text style={styles.trackingBadgeText}>🚚 Rastreando entrega...</Text>
            <Text style={styles.trackingBadgeSubtext}>
              {hasArrived ? 'Seu pedido chegou ao destino.' : 'Seu pedido saiu para entrega.'}
            </Text>
          </View>
        )}
      </View>
      
      <AdminUserMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  // ========== MAPA ==========
  mapContainer: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 112, // Espaço para a barra inferior
    borderRadius: 20,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  // ========== SEARCH ==========
  searchContainer: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    zIndex: 10,
    elevation: 10,
  },
  searchInputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  suggestionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginTop: 5,
    paddingVertical: 5,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  // ========== RECENTER BTN ==========
  recenterBtn: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  setStoreBtn: {
    position: 'absolute',
    bottom: 20,
    left: 75,
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  // ========== LEGENDA ==========
  legendBox: {
    position: 'absolute',
    bottom: 20,
    right: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '600',
  },
  // ========== TRACKING BADGE ==========
  trackingBadge: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    backgroundColor: '#1a3a6b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
  },
  trackingBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  trackingBadgeSubtext: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '600',
  },
});
