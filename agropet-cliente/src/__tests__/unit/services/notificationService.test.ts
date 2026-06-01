import { NotificationService } from '../../../services/notificationService';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../../../data/datasources/supabase/client';

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

const mockSupabaseFrom = jest.fn();
jest.mock('../../../data/datasources/supabase/client', () => {
  const mockFrom = jest.fn();
  return {
    supabase: {
      from: mockFrom,
    },
    __esModule: true,
  };
});

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

  describe('sendPushNotification', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should send push notification and return true on success', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true });
      const result = await NotificationService.sendPushNotification('token-123', 'Title', 'Body', { key: 'val' });
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'token-123', title: 'Title', body: 'Body', data: { key: 'val' }, sound: 'default' }),
      });
    });

    it('should return false when fetch returns non-ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false });
      const result = await NotificationService.sendPushNotification('token-123', 'Title', 'Body');
      expect(result).toBe(false);
    });

    it('should return false when fetch throws', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      global.fetch = jest.fn().mockRejectedValue(new Error('fetch fail'));
      const result = await NotificationService.sendPushNotification('token-123', 'Title', 'Body');
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should send with empty data object when data is not provided', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: true });
      await NotificationService.sendPushNotification('token-123', 'Title', 'Body');
      expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        body: expect.stringContaining('"data":{}'),
      }));
    });
  });

  describe('sendOrderStatusNotification', () => {
    beforeEach(() => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn(),
          }),
        }),
      });
    });

    it('should send push notification when user has push_token', async () => {
      const singleMock = jest.fn().mockResolvedValue({ data: { push_token: 'push-token-abc' }, error: null });
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ single: singleMock }),
        }),
      });
      const fetchMock = jest.fn().mockResolvedValue({ ok: true });
      global.fetch = fetchMock;

      await NotificationService.sendOrderStatusNotification('user-1', 'order-id-12345', 'confirmed');

      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(fetchMock).toHaveBeenCalledWith('https://exp.host/--/api/v2/push/send', expect.objectContaining({
        body: expect.stringContaining('"to":"push-token-abc"'),
      }));
    });

    it('should not send push if user has no push_token', async () => {
      const singleMock = jest.fn().mockResolvedValue({ data: { push_token: null }, error: null });
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ single: singleMock }),
        }),
      });
      const fetchMock = jest.fn();
      global.fetch = fetchMock;

      await NotificationService.sendOrderStatusNotification('user-1', 'order-id-12345', 'delivering');

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should handle error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      supabase.from.mockImplementation(() => { throw new Error('db error'); });
      const fetchMock = jest.fn();
      global.fetch = fetchMock;

      await NotificationService.sendOrderStatusNotification('user-1', 'order-id-12345', 'cancelled');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should use correct title and body for each status', async () => {
      const singleMock = jest.fn().mockResolvedValue({ data: { push_token: 'push-token' }, error: null });
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ single: singleMock }),
        }),
      });
      global.fetch = jest.fn().mockResolvedValue({ ok: true });

      await NotificationService.sendOrderStatusNotification('user-1', 'order-id-12345', 'preparing');
      expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        body: expect.stringContaining('"title":"Preparando Pedido"'),
      }));

      await NotificationService.sendOrderStatusNotification('user-1', 'order-id-12345', 'completed');
      expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        body: expect.stringContaining('"title":"Pedido Entregue"'),
      }));
    });

    it('should fallback to generic title for unknown status', async () => {
      const singleMock = jest.fn().mockResolvedValue({ data: { push_token: 'push-token' }, error: null });
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ single: singleMock }),
        }),
      });
      global.fetch = jest.fn().mockResolvedValue({ ok: true });

      await NotificationService.sendOrderStatusNotification('user-1', 'order-id-12345', 'unknown_status');
      expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        body: expect.stringContaining('"title":"Atualização do Pedido"'),
      }));
    });
  });
});
