import { useState, useRef, useContext, useCallback } from 'react';
import MapView from 'react-native-maps';

import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useMapMarkers } from './useMapMarkers';
import { useMapDirections } from './useMapDirections';

export function useMapScreen(route: any, navigation: any) {
  const { colors, isDarkMode } = useTheme();
  const { user } = useContext(AuthContext);
  const [searchText, setSearchText] = useState('');
  const mapRef = useRef<MapView>(null);

  const trackingOrderId = route?.params?.trackingOrderId || null;

  const {
    storeLocation,
    clientLocation,
    locationConfirmed,
    fitMapToMarkers,
  } = useMapMarkers(mapRef, user, trackingOrderId);

  const {
    routeCoordinates,
    remainingRoute,
    carPosition,
    isTracking,
    facingRight,
    hasArrived,
    showCar,
    handleGoBackFromTracking,
  } = useMapDirections(mapRef, clientLocation, storeLocation, trackingOrderId, navigation);

  const isNightTime = useCallback(() => {
    const hours = new Date().getHours();
    return hours >= 18 || hours < 6;
  }, []);

  return {
    colors,
    isDarkMode,
    searchText,
    setSearchText,
    storeLocation,
    mapRef,
    clientLocation,
    locationConfirmed,
    trackingOrderId,
    routeCoordinates,
    remainingRoute,
    carPosition,
    isTracking,
    facingRight,
    hasArrived,
    showCar,
    handleGoBackFromTracking,
    fitMapToMarkers,
    isNightTime,
  };
}
