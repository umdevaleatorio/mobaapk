import React from 'react';
import { View, Text, StatusBar, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, Circle as MapCircle } from 'react-native-maps';
import Svg, { Circle, Line, Path, Defs, LinearGradient, Stop, Rect, G } from 'react-native-svg';
import AdminHeader from '../../../components/AdminHeader';
import { AdminUserMenu } from '../../../components/AdminUserMenu';
import LupaIcon from '../../../assets/tela7/parte superior/Adicionar/Remover/Barra de Pesquisa.svg';
import { useAdminMapScreen, darkMapStyle, isNightTime, DEFAULT_STORE_LOCATION } from './useAdminMapScreen';
import { FiorinoIcon } from './FiorinoIcon';
import { styles } from './styles';

const LegendPin = ({ color }: { color: string }) => (
  <Svg width="20" height="24" viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </Svg>
);

export default function AdminMapScreen() {
  const h = useAdminMapScreen();

  const renderSuggestions = () => h.suggestions.length > 0 ? (
    <ScrollView style={[styles.suggestionsList, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF' }]} keyboardShouldPersistTaps="handled">
      {h.suggestions.map((item: any, index: number) => (
        <TouchableOpacity key={index} style={[styles.suggestionItem, { borderBottomColor: h.isDarkMode ? '#2E2E38' : '#F0F0F0' }]} onPress={() => h.handleSelectLocation(item)}>
          <Text style={[styles.suggestionText, { color: h.colors.textDark }]} numberOfLines={2}>{item.display_name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  ) : null;

  const renderSvgBtn = (d: string, strokeColor: string) => (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="12" cy="12" r="7" />
      <Circle cx="12" cy="12" r="2" fill={strokeColor} />
      <Line x1="12" y1="1" x2="12" y2="5" />
      <Line x1="12" y1="19" x2="12" y2="23" />
      <Line x1="1" y1="12" x2="5" y2="12" />
      <Line x1="19" y1="12" x2="23" y2="12" />
    </Svg>
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.colors.white }]}>
      <StatusBar backgroundColor={h.trackedClient ? 'transparent' : h.colors.headerBackground} barStyle="light-content" translucent={!!h.trackedClient} />
      {!h.trackedClient && <AdminHeader title="mapa" />}
      <View style={[styles.mapContainer, !!h.trackedClient && { marginHorizontal: 0, marginTop: 0, marginBottom: 0, borderRadius: 0 }]}>
        {!h.trackedClient && (
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputWrapper, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
              <TextInput style={[styles.searchInput, { color: h.colors.textDark }]} placeholder="Pesquisar local..." placeholderTextColor={h.isDarkMode ? '#A0A0A0' : '#919191'} value={h.searchQuery} onChangeText={h.setSearchQuery} />
            </View>
            {renderSuggestions()}
          </View>
        )}

        <MapView ref={h.mapRef} style={styles.map} initialRegion={h.storeLocation} showsUserLocation showsMyLocationButton customMapStyle={isNightTime() ? darkMapStyle : undefined} followsUserLocation={false}>
          <Marker
            draggable={h.isEditingLocation}
            onDragEnd={h.handleMarkerDragEnd}
            coordinate={{ latitude: h.storeLocation.latitude, longitude: h.storeLocation.longitude }}
            title="Agropet Lambari" description="Av. João Bráulio Júnior, 290 - Volta do Lago, Lambari - MG, 37480-000"
          />
          {!h.trackedClient && (
            <MapCircle center={{ latitude: h.storeLocation.latitude, longitude: h.storeLocation.longitude }} radius={h.deliveryRadius * 1000} fillColor="rgba(33, 150, 243, 0.15)" strokeColor="rgba(21, 101, 192, 0.6)" strokeWidth={2} />
          )}
          {h.trackedClient && (
            <Marker coordinate={{ latitude: h.trackedClient.latitude, longitude: h.trackedClient.longitude }} title={h.trackedClient.name} description={h.trackedClient.address} pinColor="blue" />
          )}
          {(h.remainingRoute.length > 1 || (h.remainingRoute.length > 0 && h.carPosition)) && (
            <>
              <Polyline coordinates={h.carPosition ? [h.carPosition, ...h.remainingRoute] : h.remainingRoute} strokeColor="#000000" strokeWidth={8} lineCap="round" lineJoin="round" />
              <Polyline coordinates={h.carPosition ? [h.carPosition, ...h.remainingRoute] : h.remainingRoute} strokeColor="#1a3a6b" strokeWidth={5} lineCap="round" lineJoin="round" />
            </>
          )}
          {h.carPosition && h.showCar && (
            <Marker coordinate={h.carPosition} anchor={{ x: 0.5, y: 0.5 }} flat title="Entregador">
              <FiorinoIcon facingRight={h.facingRight} />
            </Marker>
          )}
          {h.searchedLocation && (
            <Marker coordinate={{ latitude: h.searchedLocation.latitude, longitude: h.searchedLocation.longitude }} title={h.searchedLocation.title} description={h.searchedLocation.description} pinColor="blue" />
          )}
        </MapView>

        <TouchableOpacity style={[styles.recenterBtn, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF', borderColor: h.isDarkMode ? '#2E2E38' : '#EFEFEF' }, !!h.trackedClient && { bottom: 85 }]}
          onPress={() => { if (h.mapRef.current) h.mapRef.current.animateToRegion(h.storeLocation, 1000); }}>
          {renderSvgBtn('', h.colors.textDark)}
        </TouchableOpacity>

        {h.trackedClient ? (
          <TouchableOpacity style={[styles.setStoreBtn, { backgroundColor: 'transparent', borderWidth: 0, shadowColor: '#1a3a6b', shadowOpacity: 0.6, shadowRadius: 8, elevation: 10 }, !!h.trackedClient && { bottom: 85 }]}
            onPress={() => { if (h.mapRef.current && h.trackedClient) h.mapRef.current.animateToRegion({ latitude: h.trackedClient.latitude, longitude: h.trackedClient.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 1000); }}>
            <Svg width="48" height="48" viewBox="0 0 48 48">
              <Defs><LinearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor="#1a3a6b" /><Stop offset="100%" stopColor="#000" /></LinearGradient></Defs>
              <Rect width="48" height="48" rx="8" ry="8" fill="url(#cg)" />
              <G x="12" y="12" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="12" cy="12" r="7" /><Circle cx="12" cy="12" r="2" fill="#FFFFFF" />
                <Line x1="12" y1="1" x2="12" y2="5" /><Line x1="12" y1="19" x2="12" y2="23" />
                <Line x1="1" y1="12" x2="5" y2="12" /><Line x1="19" y1="12" x2="23" y2="12" />
              </G>
            </Svg>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.setStoreBtn, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF', borderColor: h.isDarkMode ? '#2E2E38' : '#EFEFEF' }, h.isEditingLocation && { backgroundColor: h.colors.headerBackground, borderColor: h.colors.headerBackground }]}
            onPress={h.handleSetStoreLocation}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={h.isEditingLocation ? '#FFFFFF' : h.colors.textDark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx="12" cy="10" r="3" />
            </Svg>
          </TouchableOpacity>
        )}

        <View style={[styles.legendBox, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
          <View style={styles.legendRow}><View style={{ width: 24, alignItems: 'center' }}><LegendPin color="#E53935" /></View><Text style={[styles.legendText, { color: h.colors.textDark }]}>Loja AgroPet</Text></View>
          <View style={styles.legendRow}><View style={{ width: 24, alignItems: 'center' }}><LegendPin color="#2196F3" /></View><Text style={[styles.legendText, { color: h.colors.textDark }]}>Cliente</Text></View>
        </View>

        {(h.isTracking || (h.hasArrived && h.showCar)) && (
          <View style={styles.trackingBadge}>
            <Text style={styles.trackingBadgeText}>🚚 Rastreando entrega...</Text>
            <Text style={styles.trackingBadgeSubtext}>{h.hasArrived ? 'Seu pedido chegou ao destino.' : 'Seu pedido saiu para entrega.'}</Text>
          </View>
        )}

        {!!h.trackedClient && (
          <View style={[styles.emRotaContainer, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <View style={styles.pulseContainer}><View style={styles.pulseDot} /></View>
            <Text style={[styles.emRotaText, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Em rota</Text>
          </View>
        )}

        {!!h.trackedClient && (
          <TouchableOpacity style={[styles.backBtn, h.isDarkMode ? { backgroundColor: '#2E2E38', borderColor: '#3E3E4A' } : { backgroundColor: '#042A7D', borderColor: '#032060' }]}
            onPress={h.handleGoBackFromTracking} activeOpacity={0.8}>
            <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={h.isDarkMode ? '#FFE082' : '#FFFFFF'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 19l-7-7 7-7" />
            </Svg>
            <Text style={[styles.backBtnText, { color: h.isDarkMode ? '#FFE082' : '#FFFFFF' }]}>Voltar</Text>
          </TouchableOpacity>
        )}
      </View>
      {!h.trackedClient && <AdminUserMenu />}
    </View>
  );
}
