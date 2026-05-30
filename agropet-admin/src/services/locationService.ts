import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export class LocationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.error('[LocationService] Error requesting permissions:', e);
      return false;
    }
  }

  static async getCurrentLocation(): Promise<LocationCoordinates> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Balanced,
      });

      if (position && position.coords) {
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
      }
      throw new Error('Failed to retrieve coordinates');
    } catch (error) {
      console.error('[LocationService] Error getting current location:', error);
      throw error;
    }
  }

  static async watchPosition(
    onUpdate: (coords: LocationCoordinates) => void
  ): Promise<{ remove: () => void }> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.LocationAccuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        onUpdate({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        });
      }
    );

    return subscription;
  }
}
