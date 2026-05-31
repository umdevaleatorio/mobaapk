import { useState, useEffect, useCallback, useRef } from 'react';
import MapView from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '../../../../data/datasources/supabase/client';
import { DEFAULT_STORE_LOCATION } from './constants';

export function useMapMarkers(
  mapRef: React.RefObject<MapView>,
  user: any,
  trackingOrderId: string | null,
) {
  const [storeLocation, setStoreLocation] = useState(DEFAULT_STORE_LOCATION);
  const [clientLocation, setClientLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const fetchStoreLocation = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('agropet_store_location')
        .select('latitude, longitude')
        .eq('id', 1)
        .single();

      if (data && !error) {
        setStoreLocation(prev => {
          const newLoc = {
            ...prev,
            latitude: data.latitude,
            longitude: data.longitude,
          };
          return newLoc;
        });
      }
    } catch (e) {
      console.log('Usando localização padrão da loja.');
    }
  }, []);

  const fetchClientLocation = useCallback(async () => {
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

        if (!trackingOrderId && mapRef.current) {
          setStoreLocation(currentStoreLoc => {
            const markers = [
              { latitude: currentStoreLoc.latitude, longitude: currentStoreLoc.longitude },
            ];
            if (isConfirmed) {
              markers.push(newClientLoc);
            }

            return currentStoreLoc;
          });
        }
      } else {
        setClientLocation(null);
        setLocationConfirmed(false);
      }
    } catch (e) {
      console.log('Erro ao buscar localização do cliente.', e);
    }
  }, [user, trackingOrderId]);

  useFocusEffect(
    useCallback(() => {
      fetchStoreLocation();
      fetchClientLocation();
    }, [fetchStoreLocation, fetchClientLocation])
  );

  useEffect(() => {
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
    };
  }, []);

  const fitMapToMarkers = useCallback(() => {
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
  }, [storeLocation, clientLocation]);

  return {
    storeLocation,
    clientLocation,
    locationConfirmed,
    fitMapToMarkers,
  };
}
