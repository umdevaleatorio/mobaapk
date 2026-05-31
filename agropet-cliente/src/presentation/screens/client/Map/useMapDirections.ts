import { useState, useEffect, useRef, useCallback } from 'react';
import MapView from 'react-native-maps';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../../../data/datasources/supabase/client';

export function useMapDirections(
  mapRef: React.RefObject<MapView>,
  clientLocation: { latitude: number; longitude: number } | null,
  storeLocation: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number },
  trackingOrderId: string | null,
  navigation: any,
) {
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);
  const [remainingRoute, setRemainingRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const [carPosition, setCarPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [hasArrived, setHasArrived] = useState(false);
  const [showCar, setShowCar] = useState(true);
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const routeIndexRef = useRef(0);
  const carAnimationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideCarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFitRouteRef = useRef(false);
  const clearAllTracking = useCallback(() => {
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
    setRouteCoordinates([]);
    setRemainingRoute([]);
    setCarPosition(null);
    setIsTracking(false);
    setHasArrived(false);
    setShowCar(true);
    hasFitRouteRef.current = false;
  }, []);

  const handleGoBackFromTracking = useCallback(() => {
    clearAllTracking();
    navigation.setParams({ trackingOrderId: null });
    navigation.goBack();
  }, [navigation, clearAllTracking]);
  useEffect(() => {
    const unsubscribeBlur = navigation.addListener('blur', () => {
      clearAllTracking();
      navigation.setParams({ trackingOrderId: null });
    });
    return unsubscribeBlur;
  }, [navigation, clearAllTracking]);

  const animateCarTo = useCallback((
    startCoord: { latitude: number; longitude: number },
    endCoord: { latitude: number; longitude: number },
    duration: number,
    onFinished?: () => void,
  ) => {
    const steps = Math.round(duration / 50);
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
  }, []);

  const startTracking = useCallback((coords: { latitude: number; longitude: number }[], startTime: number) => {
    setIsTracking(true);
    setHasArrived(false);
    setShowCar(true);
    routeIndexRef.current = 0;

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
      const stepDuration = 1500;
      const expectedIndex = Math.floor(elapsedMs / stepDuration);

      if (expectedIndex >= totalPoints) {
        const currentPos = carPosition || coords[routeIndexRef.current];

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
          }, 60000);
        });
        return;
      }

      const currentIndex = routeIndexRef.current;

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

    moveToNextStep();
  }, [animateCarTo, carPosition, trackingOrderId]);

  const fetchRoute = useCallback(async () => {
    if (!clientLocation) return;
    try {
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
        setCarPosition(coords[0]);
        routeIndexRef.current = 0;

        let startTime = Date.now();
        try {
          if (trackingOrderId) {
            const storedStart = await SecureStore.getItemAsync(`tracking_start_${trackingOrderId}`);
            if (storedStart) {
              const parsedStart = parseInt(storedStart, 10);
              const elapsedMs = Date.now() - parsedStart;
              const totalDuration = coords.length * 1500;

              if (elapsedMs >= totalDuration) {
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

        if (mapRef.current && coords.length > 0 && !hasFitRouteRef.current) {
          hasFitRouteRef.current = true;
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
  }, [clientLocation, storeLocation, trackingOrderId, startTracking]);

  useEffect(() => {
    if (trackingOrderId && clientLocation && storeLocation) {
      fetchRoute();
    }
  }, [trackingOrderId, clientLocation, storeLocation]);

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
  return {
    routeCoordinates,
    remainingRoute,
    carPosition,
    isTracking,
    facingRight,
    hasArrived,
    showCar,
    handleGoBackFromTracking,
  };
}
