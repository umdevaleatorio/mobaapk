import { supabase } from '../../../../data/datasources/supabase/client';

export const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const nominatimSearch = async (query: string, limit = 1) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&countrycodes=br&addressdetails=1`,
    {
      headers: {
        'User-Agent': 'AgropetAppCliente/1.0',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      }
    }
  );
  return response.json();
};

export const fetchStoreLocation = async () => {
  let storeLat = -21.9765;
  let storeLng = -45.3469;
  try {
    const { data } = await supabase
      .from('agropet_store_location')
      .select('latitude, longitude')
      .eq('id', 1)
      .single();
    if (data) {
      storeLat = data.latitude;
      storeLng = data.longitude;
    }
  } catch (e) {
    console.log('Error loading store location:', e);
  }
  return { storeLat, storeLng };
};

export const fetchDeliveryRadius = async () => {
  let maxRadius = 17;
  try {
    const { data } = await supabase
      .from('store_settings')
      .select('delivery_radius_km')
      .maybeSingle();
    if (data && data.delivery_radius_km !== null) {
      maxRadius = data.delivery_radius_km;
    }
  } catch (e) {
    console.log('Error loading delivery radius:', e);
  }
  return maxRadius;
};
