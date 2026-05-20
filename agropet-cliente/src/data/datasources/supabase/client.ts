import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// Adaptador para tornar o SecureStore compatível com o Supabase Auth,
// dividindo valores maiores que 2048 bytes para superar a limitação do Expo SecureStore.
// Usamos 1000 bytes pois o processo de criptografia e encoding do OS adiciona overhead (aumentando o tamanho final).
const CHUNK_SIZE = 1000;

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}_chunk_count`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        const chunks: string[] = [];
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
          if (chunk) {
            chunks.push(chunk);
          } else {
            return null;
          }
        }
        return chunks.join('');
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Erro ao ler do SecureStore:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await ExpoSecureStoreAdapter.removeItem(key);

      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.substring(i, i + CHUNK_SIZE));
      }

      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunks[i]);
      }

      await SecureStore.setItemAsync(`${key}_chunk_count`, chunks.length.toString());
    } catch (error) {
      console.error('Erro ao gravar no SecureStore:', error);
      throw error;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const countStr = await SecureStore.getItemAsync(`${key}_chunk_count`);
      if (countStr) {
        const count = parseInt(countStr, 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
        }
        await SecureStore.deleteItemAsync(`${key}_chunk_count`);
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Erro ao remover do SecureStore:', error);
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
