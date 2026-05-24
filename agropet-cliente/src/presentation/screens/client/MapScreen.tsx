import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
  Animated,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Svg, { Circle, Line, Path, Defs, LinearGradient, Stop, Rect, G, Ellipse } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';

import { AuthContext } from '../../contexts/AuthContext';
import { CatalogHeader } from '../../components/CatalogHeader';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../../data/datasources/supabase/client';

const DEFAULT_STORE_LOCATION = {
  latitude: -21.9765,
  longitude: -45.3469,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

// Marcador customizado para o carrinho (rastreamento)
const CustomDot = ({ color, borderColor, size = 20 }: { color: string; borderColor: string; size?: number }) => (
  <View style={{
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    borderWidth: 3,
    borderColor: borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  }} />
);

// Pino para usar apenas na legenda
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

export default function MapScreen({ route, navigation }: any) {
  const { colors, isDarkMode } = useTheme();
  const { user } = useContext(AuthContext);
  const [searchText, setSearchText] = useState('');
  const [storeLocation, setStoreLocation] = useState(DEFAULT_STORE_LOCATION);
  const mapRef = useRef<MapView>(null);

  // Estado do cliente
  const [clientLocation, setClientLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  // Estado do rastreamento
  const trackingOrderId = route?.params?.trackingOrderId || null;
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [remainingRoute, setRemainingRoute] = useState<{ latitude: number; longitude: number }[]>([]);

  // Limpar parâmetros de rastreamento ao perder o foco (blur)
  useEffect(() => {
    const unsubscribeBlur = navigation.addListener('blur', () => {
      // Limpar todos os timers
      if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
      if (carAnimationIntervalRef.current) clearInterval(carAnimationIntervalRef.current);
      if (trackingTimeoutRef.current) clearTimeout(trackingTimeoutRef.current);
      if (hideCarTimeoutRef.current) clearTimeout(hideCarTimeoutRef.current);

      // Limpar estados locais
      setRouteCoordinates([]);
      setRemainingRoute([]);
      setCarPosition(null);
      setIsTracking(false);
      setHasArrived(false);
      setShowCar(true);

      // Resetar parâmetro de rota
      navigation.setParams({ trackingOrderId: null });
    });

    return unsubscribeBlur;
  }, [navigation]);

  const handleGoBackFromTracking = () => {
    // 1. Limpar timers e intervalos locais de rastreamento
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
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

    // 2. Resetar estados locais de rastreamento
    setRouteCoordinates([]);
    setRemainingRoute([]);
    setCarPosition(null);
    setIsTracking(false);
    setHasArrived(false);

    // 3. Resetar parâmetros de rota do React Navigation
    navigation.setParams({ trackingOrderId: null });

    // 4. Voltar para a tela anterior
    navigation.goBack();
  };
  const [carPosition, setCarPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [hasArrived, setHasArrived] = useState(false);
  const [showCar, setShowCar] = useState(true);
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeIndexRef = useRef(0);
  
  // Refs para suavizar movimento (deslizar) e catch-up
  const carAnimationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideCarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Buscar localizações da loja e do cliente sempre que a tela receber foco
  useFocusEffect(
    useCallback(() => {
      fetchStoreLocation();
      fetchClientLocation();
    }, [user])
  );

  // Ouvir mudanças em tempo real da localização da loja no Supabase ao abrir a tela
  useEffect(() => {
    // Ouvir mudanças em tempo real (quando o Admin arrastar o pino)
    const subscription = supabase
      .channel('store_location_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agropet_store_location',
        },
        (payload: any) => {
          if (payload.new && payload.new.latitude && payload.new.longitude) {
            const newLoc = {
              ...DEFAULT_STORE_LOCATION,
              latitude: payload.new.latitude,
              longitude: payload.new.longitude,
            };
            setStoreLocation(newLoc);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      // Limpar intervalo de rastreamento ao sair
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      if (carAnimationIntervalRef.current) {
        clearInterval(carAnimationIntervalRef.current);
      }
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }
    };
  }, []);

  // Quando temos trackingOrderId + ambas as localizações, buscar rota
  useEffect(() => {
    if (trackingOrderId && clientLocation && storeLocation) {
      fetchRoute();
    }
  }, [trackingOrderId, clientLocation, storeLocation]);

  const fetchStoreLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('agropet_store_location')
        .select('latitude, longitude')
        .eq('id', 1)
        .single();
      
      if (data && !error) {
        const newLoc = {
          ...DEFAULT_STORE_LOCATION,
          latitude: data.latitude,
          longitude: data.longitude,
        };
        setStoreLocation(newLoc);
        // Animar para a posição correta após o mapa carregar
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.animateToRegion(newLoc, 1000);
          }
        }, 500);
      }
    } catch (e) {
      console.log('Usando localização padrão da loja.');
    }
  };

  const fetchClientLocation = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('lat, lng, location_confirmed')
        .eq('id', user.id)
        .single();
      
      if (data && !error && data.lat && data.lng) {
        const newClientLoc = { latitude: data.lat, longitude: data.lng };
        setClientLocation(newClientLoc);
        
        const isConfirmed = !!data.location_confirmed;
        setLocationConfirmed(isConfirmed);

        // Se o endereço estiver confirmado e não estiver rastreando, enquadrar mapa
        if (!trackingOrderId && mapRef.current) {
          const markers = [
            { latitude: storeLocation.latitude, longitude: storeLocation.longitude },
          ];
          if (isConfirmed) {
            markers.push(newClientLoc);
          }

          setTimeout(() => {
            if (mapRef.current) {
              if (markers.length > 1) {
                mapRef.current.fitToCoordinates(markers, {
                  edgePadding: { top: 80, right: 50, bottom: 150, left: 50 },
                  animated: true,
                });
              } else {
                mapRef.current.animateToRegion(storeLocation, 1000);
              }
            }
          }, 600);
        }
      } else {
        setClientLocation(null);
        setLocationConfirmed(false);
      }
    } catch (e) {
      console.log('Erro ao buscar localização do cliente.', e);
    }
  };

  // Buscar rota entre loja e casa do cliente via OSRM
  const fetchRoute = async () => {
    if (!clientLocation) return;
    try {
      // OSRM usa formato: longitude,latitude
      const origin = `${storeLocation.longitude},${storeLocation.latitude}`;
      const destination = `${clientLocation.longitude},${clientLocation.latitude}`;

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin};${destination}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates.map(
          (coord: [number, number]) => ({
            latitude: coord[1],
            longitude: coord[0],
          })
        );
        setRouteCoordinates(coords);
        setRemainingRoute(coords);
        setCarPosition(coords[0]); // Começa na loja
        routeIndexRef.current = 0;

        // Iniciar simulação de rastreamento com persistência de tempo
        let startTime = Date.now();
        try {
          if (trackingOrderId) {
            const storedStart = await SecureStore.getItemAsync(`tracking_start_${trackingOrderId}`);
            if (storedStart) {
              const parsedStart = parseInt(storedStart, 10);
              const elapsedMs = Date.now() - parsedStart;
              const totalDuration = coords.length * 1500; // 1.5s por ponto

              if (elapsedMs >= totalDuration) {
                // Se já passou do tempo total da rota, reinicia a simulação do zero para fins de demonstração
                startTime = Date.now();
                await SecureStore.setItemAsync(`tracking_start_${trackingOrderId}`, startTime.toString());
              } else {
                startTime = parsedStart;
              }
            } else {
              await SecureStore.setItemAsync(`tracking_start_${trackingOrderId}`, startTime.toString());
            }
          }
        } catch (e) {
          console.log('Erro com SecureStore', e);
        }

        startTracking(coords, startTime);

        // Ajustar o mapa para mostrar a rota inteira
        if (mapRef.current && coords.length > 0) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(coords, {
              edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
              animated: true,
            });
          }, 1000);
        }
      }
    } catch (e) {
      console.log('Erro ao buscar rota OSRM:', e);
    }
  };

  // Para suavizar o movimento do carro (deslizar)
  const animateCarTo = (
    startCoord: { latitude: number; longitude: number },
    endCoord: { latitude: number; longitude: number },
    duration: number, // duração do deslize em ms
    onFinished?: () => void
  ) => {
    const steps = Math.round(duration / 50); // Atualizações a cada 50ms para suavidade (20fps)
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
  const startTracking = (coords: { latitude: number; longitude: number }[], startTime: number) => {
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
      
      // Cada coordenada da rota leva 1.5s (1500ms) no tempo de simulação normal
      const stepDuration = 1500; 
      const expectedIndex = Math.floor(elapsedMs / stepDuration);

      if (expectedIndex >= totalPoints) {
        // Simulação concluída
        const currentPos = carPosition || coords[routeIndexRef.current];
        
        // Determina a direção final para que estacione virada pro lado correto
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

          // Atualizar o status do pedido para 'completed' no banco de dados para teste
          if (trackingOrderId) {
            const { error } = await supabase
              .from('orders')
              .update({ status: 'completed' })
              .eq('id', trackingOrderId);
              
            if (error) {
              console.log('Erro ao atualizar pedido para entregue:', error);
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
      
      // Se a diferença de pontos é muito grande (ex: abriu o app 2 minutos depois),
      // nós pulamos para perto do local atual (ex: 5 pontos atrás) para não demorar demais deslizando,
      // e depois corremos o restante deslizando bem rápido
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

      // Atualiza a orientação da fiorino com base na variação de longitude
      if (endC.longitude !== startC.longitude) {
        setFacingRight(endC.longitude > startC.longitude);
      }

      // Determina a velocidade do deslize (150ms se estiver atrasado para catch-up, ou 1500ms no ritmo normal)
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

  // Limpar rastreamento ao sair da tela ou ao receber nova rota
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
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

  // Centralizar mapa para mostrar ambos os pontos
  const fitMapToMarkers = () => {
    if (!mapRef.current) return;
    
    const markers = [
      { latitude: storeLocation.latitude, longitude: storeLocation.longitude },
    ];
    if (clientLocation) {
      markers.push(clientLocation);
    }

    if (markers.length > 1) {
      mapRef.current.fitToCoordinates(markers, {
        edgePadding: { top: 80, right: 50, bottom: 150, left: 50 },
        animated: true,
      });
    } else {
      mapRef.current.animateToRegion(storeLocation, 1000);
    }
  };

  const isNightTime = () => {
    const hours = new Date().getHours();
    return hours >= 18 || hours < 6;
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.backgroundLight }]}>
      <StatusBar backgroundColor={trackingOrderId ? 'transparent' : colors.headerBackground} barStyle="light-content" translucent={!!trackingOrderId} />

      {/* Header do Cliente (Oculto em Rastreamento Expandido) */}
      {!trackingOrderId && (
        <CatalogHeader
          title="Mapa/Frete"
          searchText={searchText}
          onSearchChange={setSearchText}
        />
      )}

      {/* ========== MAPA ========== */}
      <View style={[
        styles.mapContainer,
        !!trackingOrderId && {
          marginHorizontal: 0,
          marginTop: 0,
          marginBottom: 0,
          borderRadius: 0,
        }
      ]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={DEFAULT_STORE_LOCATION}
          onMapReady={fitMapToMarkers}
          customMapStyle={isNightTime() ? darkMapStyle : undefined}
        >
          {/* Pin da loja (vermelho padrão) */}
          <Marker
            coordinate={{
              latitude: storeLocation.latitude,
              longitude: storeLocation.longitude,
            }}
            title="Agropet Lambari"
            description="Av. João Bráulio Júnior, 290 - Volta do Lago, Lambari - MG, 37480-000"
          />

          {/* Pin da casa do cliente (azul padrão) — somente se location_confirmed */}
          {locationConfirmed && clientLocation && (
            <Marker
              key={`client-marker-${clientLocation.latitude}-${clientLocation.longitude}-blue`}
              coordinate={clientLocation}
              title="Sua casa"
              description="Seu endereço cadastrado"
              pinColor="blue"
            />
          )}

          {/* ========== ROTA DE RASTREAMENTO ========== */}
          {/* Borda preta da rota (camada mais grossa por baixo) */}
          {(remainingRoute.length > 1 || (remainingRoute.length > 0 && carPosition)) && (
            <Polyline
              coordinates={carPosition ? [carPosition, ...remainingRoute] : remainingRoute}
              strokeColor={isDarkMode ? '#000000' : '#000000'}
              strokeWidth={8}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {/* Linha azul escuro da rota (por cima) */}
          {(remainingRoute.length > 1 || (remainingRoute.length > 0 && carPosition)) && (
            <Polyline
              coordinates={carPosition ? [carPosition, ...remainingRoute] : remainingRoute}
              strokeColor={isDarkMode ? '#22A3F3' : '#1a3a6b'}
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
        </MapView>
        
        {/* Botões de Centralizar (Mira) */}
        <View style={[
          styles.recenterContainer,
          !!trackingOrderId && { bottom: 85 }
        ]}>
          {/* Mira da Loja (aponta só para a loja) */}
          <TouchableOpacity 
            style={[styles.recenterBtn, { 
              backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF',
              borderColor: isDarkMode ? '#3E3E4A' : '#EFEFEF' 
            }]}
            onPress={() => mapRef.current?.animateToRegion({
              latitude: storeLocation.latitude,
              longitude: storeLocation.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }, 1000)}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#FFFFFF' : '#1C2434'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <Circle cx="12" cy="12" r="7" />
              <Circle cx="12" cy="12" r="2" fill={isDarkMode ? '#FFFFFF' : '#1C2434'} />
              <Line x1="12" y1="1" x2="12" y2="5" />
              <Line x1="12" y1="19" x2="12" y2="23" />
              <Line x1="1" y1="12" x2="5" y2="12" />
              <Line x1="19" y1="12" x2="23" y2="12" />
            </Svg>
          </TouchableOpacity>

          {/* Mira do Cliente (fundo gradiente azul escuro/preto e mira branca com brilho) */}
          {locationConfirmed && clientLocation && (
            <TouchableOpacity 
              style={[
                styles.recenterBtn, 
                { 
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  shadowColor: isDarkMode ? '#22A3F3' : '#1a3a6b', 
                  shadowOpacity: 0.6, 
                  shadowRadius: 8, 
                  elevation: 10,
                }
              ]}
              onPress={() => mapRef.current?.animateToRegion({
                latitude: clientLocation.latitude,
                longitude: clientLocation.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }, 1000)}
            >
              <Svg width="48" height="48" viewBox="0 0 48 48">
                <Defs>
                  <LinearGradient id="clientGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={isDarkMode ? '#22A3F3' : '#1a3a6b'} stopOpacity="1" />
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
          )}
        </View>

        {/* ========== LEGENDA (só aparece após Enviar endereço) ========== */}
        {locationConfirmed && (
          <View style={[styles.legendBox, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            {/* Ponto Vermelho - Loja */}
            <View style={styles.legendRow}>
              <View style={{ width: 24, alignItems: 'center' }}>
                <LegendPin color="#E53935" />
              </View>
              <Text style={[styles.legendText, { color: colors.textDark }]}>Loja AgroPet</Text>
            </View>
            {/* Ponto Azul - Casa */}
            <View style={styles.legendRow}>
              <View style={{ width: 24, alignItems: 'center' }}>
                <LegendPin color="#2196F3" />
              </View>
              <Text style={[styles.legendText, { color: colors.textDark }]}>Sua casa</Text>
            </View>
          </View>
        )}

        {/* Indicador de rastreamento ativo ou concluído (some após 1 minuto junto com a fiorino) */}
        {(isTracking || (hasArrived && showCar)) && (
          <View style={[styles.trackingBadge, { backgroundColor: isDarkMode ? '#2E2E38' : '#1a3a6b' }]}>
            <Text style={styles.trackingBadgeText}>🚚 Rastreando entrega...</Text>
            <Text style={styles.trackingBadgeSubtext}>
              {hasArrived ? 'Seu pedido chegou ao destino.' : 'Seu pedido saiu para entrega.'}
            </Text>
          </View>
        )}

        {/* Banner premium "Em rota" */}
        {!!trackingOrderId && (
          <View style={[
            styles.emRotaContainer,
            { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }
          ]}>
            <View style={styles.pulseContainer}>
              <View style={styles.pulseDot} />
            </View>
            <Text style={[styles.emRotaText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
              Em rota
            </Text>
          </View>
        )}

        {/* Botão Voltar Customizado */}
        {!!trackingOrderId && (
          <TouchableOpacity
            style={[
              styles.backBtn,
              isDarkMode
                ? { backgroundColor: '#2E2E38', borderColor: '#3E3E4A' }
                : { backgroundColor: '#042A7D', borderColor: '#032060' }
            ]}
            onPress={handleGoBackFromTracking}
            activeOpacity={0.8}
          >
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#FFE082' : '#FFFFFF'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 19l-7-7 7-7" />
            </Svg>
            <Text style={[
              styles.backBtnText,
              { color: isDarkMode ? '#FFE082' : '#FFFFFF' }
            ]}>
              Voltar
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
  // ========== RECENTER BTN ==========
  recenterContainer: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    flexDirection: 'row',
    gap: 12,
    zIndex: 10,
  },
  recenterBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
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
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '600',
  },
  // ========== TRACKING BADGE ==========
  trackingBadge: {
    position: 'absolute',
    top: 100,
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
  // ========== MAPA EXPANDIDO OVERLAYS ==========
  emRotaContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 99,
    gap: 8,
  },
  pulseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  emRotaText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  backBtn: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1.5,
    gap: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 99,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
