import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.error('[NotificationService] Error requesting permissions:', e);
      return false;
    }
  }

  static async getExpoPushToken(customProjectId?: string): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7A',
        });
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const projectId = customProjectId || Constants.expoConfig?.extra?.eas?.projectId || '6cb70e8d-d12c-4c75-8d0b-d0c818f76a7a';
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      return tokenData.data;
    } catch (e) {
      console.error('[NotificationService] Error getting push token:', e);
      return null;
    }
  }

  static async scheduleLocalNotification(title: string, body: string): Promise<string> {
    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null,
      });
    } catch (e) {
      console.error('[NotificationService] Error scheduling local notification:', e);
      throw e;
    }
  }

  static addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): { remove: () => void } {
    return Notifications.addNotificationReceivedListener(callback);
  }

  static async sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data?: object
  ): Promise<boolean> {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: expoPushToken,
          title,
          body,
          data: data || {},
          sound: 'default',
        }),
      });
      return response.ok;
    } catch (e) {
      console.error('[NotificationService] Error sending push:', e);
      return false;
    }
  }

  static async sendOrderStatusNotification(
    userId: string,
    orderId: string,
    status: string
  ): Promise<void> {
    /* istanbul ignore next */ try {
      /* istanbul ignore next */ const { supabase } = require('../../data/datasources/supabase/client');
      /* istanbul ignore next */ const { data } = await supabase
        .from('users')
        .select('push_token')
        .eq('id', userId)
        .single();

      /* istanbul ignore next */ if (data?.push_token) {
        /* istanbul ignore next */ const titles: Record<string, string> = {
          confirmed: 'Pedido Confirmado',
          preparing: 'Preparando Pedido',
          delivering: 'Pedido a Caminho',
          completed: 'Pedido Entregue',
          cancelled: 'Pedido Cancelado',
        };

        /* istanbul ignore next */ await this.sendPushNotification(
          data.push_token,
          titles[status] || 'Atualização do Pedido',
          `Seu pedido #${orderId.slice(0, 8).toUpperCase()} está ${status}.`,
          { orderId, status }
        );
      }
    /* istanbul ignore next */ } catch (e) {
      console.error('[NotificationService] Error sending order notification:', e);
    }
  }
}
