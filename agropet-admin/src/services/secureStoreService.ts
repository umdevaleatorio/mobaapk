import * as SecureStore from 'expo-secure-store';

export class SecureStoreService {
  static async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.error(`[SecureStoreService] Error reading key "${key}":`, e);
      return null;
    }
  }

  static async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      console.error(`[SecureStoreService] Error writing key "${key}":`, e);
      throw e;
    }
  }

  static async deleteItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      console.error(`[SecureStoreService] Error deleting key "${key}":`, e);
      throw e;
    }
  }
}
