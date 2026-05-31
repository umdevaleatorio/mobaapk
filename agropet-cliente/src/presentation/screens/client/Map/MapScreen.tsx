import React from 'react';
import {
  View,
  StatusBar,
  TouchableOpacity,
  Text,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Svg, { Circle, Line, Path, Defs, LinearGradient, Stop, Rect, G } from 'react-native-svg';

import { CatalogHeader } from '../../../components/CatalogHeader';
import { useMapScreen } from './useMapScreen';
import { FiorinoIcon, LegendPin } from './components';
import { darkMapStyle, DEFAULT_STORE_LOCATION } from './constants';
import { styles } from './MapScreen.styles';

export default function MapScreen({ route, navigation }: any) {
  const {
    colors,
    isDarkMode,
    searchText,
    setSearchText,
    storeLocation,
    mapRef,
    clientLocation,
    locationConfirmed,
    trackingOrderId,
    remainingRoute,
    carPosition,
    isTracking,
    facingRight,
    hasArrived,
    showCar,
    handleGoBackFromTracking,
    fitMapToMarkers,
    isNightTime,
  } = useMapScreen(route, navigation);

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.backgroundLight }]}>
      <StatusBar backgroundColor={trackingOrderId ? 'transparent' : colors.headerBackground} barStyle="light-content" translucent={!!trackingOrderId} />

      {!trackingOrderId && (
        <CatalogHeader
          title="Mapa/Frete"
          searchText={searchText}
          onSearchChange={setSearchText}
        />
      )}

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
          followsUserLocation={false}
        >
          <Marker
            coordinate={{
              latitude: storeLocation.latitude,
              longitude: storeLocation.longitude,
            }}
            title="Agropet Lambari"
            description="Av. João Bráulio Júnior, 290 - Volta do Lago, Lambari - MG, 37480-000"
          />

          {locationConfirmed && clientLocation && (
            <Marker
              key={`client-marker-${clientLocation.latitude}-${clientLocation.longitude}-blue`}
              coordinate={clientLocation}
              title="Sua casa"
              description="Seu endereço cadastrado"
              pinColor="blue"
            />
          )}

          {(remainingRoute.length > 1 || (remainingRoute.length > 0 && carPosition)) && (
            <Polyline
              coordinates={carPosition ? [carPosition, ...remainingRoute] : remainingRoute}
              strokeColor={isDarkMode ? '#000000' : '#000000'}
              strokeWidth={8}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {(remainingRoute.length > 1 || (remainingRoute.length > 0 && carPosition)) && (
            <Polyline
              coordinates={carPosition ? [carPosition, ...remainingRoute] : remainingRoute}
              strokeColor={isDarkMode ? '#22A3F3' : '#1a3a6b'}
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
            />
          )}

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

        <View style={[
          styles.recenterContainer,
          !!trackingOrderId && { bottom: 85 }
        ]}>
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

        {locationConfirmed && (
          <View style={[styles.legendBox, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <View style={styles.legendRow}>
              <View style={{ width: 24, alignItems: 'center' }}>
                <LegendPin color="#E53935" />
              </View>
              <Text style={[styles.legendText, { color: colors.textDark }]}>Loja AgroPet</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={{ width: 24, alignItems: 'center' }}>
                <LegendPin color="#2196F3" />
              </View>
              <Text style={[styles.legendText, { color: colors.textDark }]}>Sua casa</Text>
            </View>
          </View>
        )}

        {(isTracking || (hasArrived && showCar)) && (
          <View style={[styles.trackingBadge, { backgroundColor: isDarkMode ? '#2E2E38' : '#1a3a6b' }]}>
            <Text style={styles.trackingBadgeText}>🚚 Rastreando entrega...</Text>
            <Text style={styles.trackingBadgeSubtext}>
              {hasArrived ? 'Seu pedido chegou ao destino.' : 'Seu pedido saiu para entrega.'}
            </Text>
          </View>
        )}

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
