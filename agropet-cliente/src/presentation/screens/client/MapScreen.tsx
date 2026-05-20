import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Svg, { Circle, Line } from 'react-native-svg';
import { useUserMenu } from '../../contexts/UserMenuContext';
import { CatalogHeader } from '../../components/CatalogHeader';
import { supabase } from '../../../data/datasources/supabase/client';

const DEFAULT_STORE_LOCATION = {
  latitude: -21.9765,
  longitude: -45.3469,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

export default function MapScreen() {
  const [searchText, setSearchText] = useState('');
  const [storeLocation, setStoreLocation] = useState(DEFAULT_STORE_LOCATION);
  const mapRef = React.useRef<MapView>(null);

  // Buscar localização da loja no Supabase ao abrir a tela
  React.useEffect(() => {
    fetchStoreLocation();

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
            if (mapRef.current) {
              mapRef.current.animateToRegion(newLoc, 1000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
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

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#1C2434" barStyle="light-content" />

      {/* Header do Cliente (MiniLogo + Titulo + Busca + Perfil) */}
      <CatalogHeader
        title="Mapa/Frete"
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      {/* ========== MAPA (Google Maps) ========== */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={DEFAULT_STORE_LOCATION}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {/* Pin da loja */}
          <Marker
            coordinate={{
              latitude: storeLocation.latitude,
              longitude: storeLocation.longitude,
            }}
            title="Agropet Lambari"
            description="Av. João Bráulio Júnior, 290 - Volta do Lago, Lambari - MG, 37480-000"
          />
        </MapView>
        
        {/* Botão de Centralizar na Loja - Mesmo design e posição do Admin */}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  // ========== MAPA (IDENTICO AO ADMIN) ==========
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
  // ========== RECENTER BTN (IDENTICO AO ADMIN) ==========
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
});
