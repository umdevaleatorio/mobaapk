import React, { useState } from 'react';
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
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { supabase } from '../../../data/datasources/supabase/client';

// Iremos adicionar um ícone de Lupa se houver, ou apenas usar um emoji/texto
import LupaIcon from '../../assets/tela7/parte superior/Adicionar/Remover/Barra de Pesquisa.svg';

const DEFAULT_STORE_LOCATION = {
  latitude: -21.9765,
  longitude: -45.3469,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

export default function AdminMapScreen() {
  const mapRef = React.useRef<MapView>(null);
  const [storeLocation, setStoreLocation] = useState(DEFAULT_STORE_LOCATION);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<any>(null);

  React.useEffect(() => {
    fetchStoreLocation();
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

  // Removed old handleUpdateStoreLocation because it is now handled by onDragEnd

  // Debounced search for Nominatim API
  React.useEffect(() => {
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
      // Forçando a busca ser apenas em Lambari - MG
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
          
          {/* Pin do Local Pesquisado */}
          {searchedLocation && (
            <Marker
              coordinate={{
                latitude: searchedLocation.latitude,
                longitude: searchedLocation.longitude,
              }}
              title={searchedLocation.title}
              description={searchedLocation.description}
              pinColor="blue" // Cor diferente para destacar a pesquisa
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

        {/* Botão de Definir Nova Localização da Loja */}
        <TouchableOpacity 
          style={[
            styles.setStoreBtn,
            isEditingLocation && { backgroundColor: '#1C2434', borderColor: '#1C2434' }
          ]}
          onPress={() => {
            if (isEditingLocation) {
              setIsEditingLocation(false); // Cancela o modo de edição
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
    elevation: 10, // for android
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
    left: 75, // Colocado do lado direito do botão de mira (que está no left: 15 e tem width: 48)
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
