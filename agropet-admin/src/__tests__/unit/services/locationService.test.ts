import { LocationService } from '../../../services/locationService';
import * as Location from 'expo-location';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  LocationAccuracy: {
    Balanced: 3,
    High: 4,
  },
}));

describe('LocationService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should request permissions and return status', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    const result = await LocationService.requestPermissions();
    expect(result).toBe(true);
  });

  it('should return false if permissions are denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    const result = await LocationService.requestPermissions();
    expect(result).toBe(false);
  });

  it('should retrieve coordinates when permitted', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: -21.97,
        longitude: -45.35,
        accuracy: 10,
      },
    });

    const coords = await LocationService.getCurrentLocation();
    expect(coords.latitude).toBe(-21.97);
    expect(coords.longitude).toBe(-45.35);
    expect(coords.accuracy).toBe(10);
  });

  it('should throw error when permission is not granted', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    await expect(LocationService.getCurrentLocation()).rejects.toThrow('Location permission not granted');
    consoleErrorSpy.mockRestore();
  });

  it('should watch position and receive coordinates update', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.watchPositionAsync as jest.Mock).mockImplementation(
      async (options, callback) => {
        callback({
          coords: {
            latitude: -21.98,
            longitude: -45.36,
            accuracy: 8,
          },
        });
        return { remove: jest.fn() };
      }
    );

    const onUpdate = jest.fn();
    const sub = await LocationService.watchPosition(onUpdate);

    expect(onUpdate).toHaveBeenCalledWith({
      latitude: -21.98,
      longitude: -45.36,
      accuracy: 8,
    });
    expect(sub.remove).toBeDefined();
  });

  it('should return false if requestPermissionsAsync throws an error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Keystore error'));
    const result = await LocationService.requestPermissions();
    expect(result).toBe(false);
    consoleErrorSpy.mockRestore();
  });

  it('should throw error when getCurrentPositionAsync returns invalid coordinates', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(null); // returns null

    await expect(LocationService.getCurrentLocation()).rejects.toThrow('Failed to retrieve coordinates');
    consoleErrorSpy.mockRestore();
  });

  it('should throw error when watchPosition is called without permission', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    const cb = jest.fn();
    await expect(LocationService.watchPosition(cb)).rejects.toThrow('Location permission not granted');
  });
});
