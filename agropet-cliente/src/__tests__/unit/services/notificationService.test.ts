import { NotificationService } from '../../../services/notificationService';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: {
    MAX: 4,
  },
}));

describe('NotificationService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should request permissions and return true if granted', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    const result = await NotificationService.requestPermissions();
    expect(result).toBe(true);
  });

  it('should return push token if permission is granted', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'expo-token-abc' });

    const token = await NotificationService.getExpoPushToken();
    expect(token).toBe('expo-token-abc');
  });

  it('should return null if push permissions are denied', async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });
    const token = await NotificationService.getExpoPushToken();
    expect(token).toBeNull();
  });

  it('should schedule local notification correctly', async () => {
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notif-id-123');
    const result = await NotificationService.scheduleLocalNotification('Hello', 'World');
    expect(result).toBe('notif-id-123');
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: 'Hello',
        body: 'World',
        sound: true,
      },
      trigger: null,
    });
  });

  it('should register callback with notifications received listener', () => {
    const unsub = { remove: jest.fn() };
    (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(unsub);

    const cb = jest.fn();
    const result = NotificationService.addNotificationReceivedListener(cb);
    expect(result).toBe(unsub);
    expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(cb);
  });

  it('should return false if requestPermissionsAsync throws an error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (Notifications.requestPermissionsAsync as jest.Mock).mockRejectedValue(new Error('Auth failed'));
    const result = await NotificationService.requestPermissions();
    expect(result).toBe(false);
    consoleErrorSpy.mockRestore();
  });

  it('should return null if getExpoPushToken throws an error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(new Error('Token fetch error'));

    const token = await NotificationService.getExpoPushToken();
    expect(token).toBeNull();
    consoleErrorSpy.mockRestore();
  });

  it('should throw error when scheduleLocalNotification fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(new Error('Schedule error'));

    await expect(NotificationService.scheduleLocalNotification('Hi', 'Bye')).rejects.toThrow('Schedule error');
    consoleErrorSpy.mockRestore();
  });

  it('should register notification channel if platform is Android', async () => {
    const originalPlatform = Platform.OS;
    Platform.OS = 'android';

    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: 'android-token' });

    const token = await NotificationService.getExpoPushToken();
    expect(token).toBe('android-token');
    expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('default', expect.any(Object));

    Platform.OS = originalPlatform; // Restore original platform
  });
});
