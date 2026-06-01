// This test needs the REAL supabase client (not the mock from jest-setup.ts)
jest.unmock('@supabase/supabase-js');

import { supabase } from '../../../data/datasources/supabase/client';
import * as SecureStore from 'expo-secure-store';

describe('Supabase Client SecureStore Adapter', () => {
  let adapter: any;

  beforeAll(() => {
    // Retorna o storage configurado no cliente Supabase
    // @ts-ignore
    adapter = supabase.auth.storage;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get standard key if no chunks are stored', async () => {
    const mockGet = SecureStore.getItemAsync as jest.Mock;
    mockGet.mockImplementation((key: string) => {
      if (key === 'my-key_chunk_count') return Promise.resolve(null);
      if (key === 'my-key') return Promise.resolve('my-value');
      return Promise.resolve(null);
    });

    const result = await adapter.getItem('my-key');
    expect(result).toBe('my-value');
    expect(mockGet).toHaveBeenCalledWith('my-key_chunk_count');
    expect(mockGet).toHaveBeenCalledWith('my-key');
  });

  it('should get concatenated chunks if chunk count is present', async () => {
    const mockGet = SecureStore.getItemAsync as jest.Mock;
    mockGet.mockImplementation((key: string) => {
      if (key === 'my-key_chunk_count') return Promise.resolve('3');
      if (key === 'my-key_chunk_0') return Promise.resolve('chunk0_');
      if (key === 'my-key_chunk_1') return Promise.resolve('chunk1_');
      if (key === 'my-key_chunk_2') return Promise.resolve('chunk2');
      return Promise.resolve(null);
    });

    const result = await adapter.getItem('my-key');
    expect(result).toBe('chunk0_chunk1_chunk2');
  });

  it('should return null if any chunk is missing', async () => {
    const mockGet = SecureStore.getItemAsync as jest.Mock;
    mockGet.mockImplementation((key: string) => {
      if (key === 'my-key_chunk_count') return Promise.resolve('2');
      if (key === 'my-key_chunk_0') return Promise.resolve('chunk0');
      if (key === 'my-key_chunk_1') return Promise.resolve(null);
      return Promise.resolve(null);
    });

    const result = await adapter.getItem('my-key');
    expect(result).toBeNull();
  });

  it('should handle error when reading from SecureStore', async () => {
    const mockGet = SecureStore.getItemAsync as jest.Mock;
    mockGet.mockRejectedValue(new Error('SecureStore failure'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await adapter.getItem('my-key');
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should set item without chunks if size is within limits (less than 1000 bytes)', async () => {
    const mockSet = SecureStore.setItemAsync as jest.Mock;
    const value = 'small-value';
    
    await adapter.setItem('my-key', value);
    
    // Devem ser gravados os chunks mesmo para valores pequenos?
    // Analisando client.ts:
    // const chunks = [];
    // for (let i = 0; i < value.length; i += CHUNK_SIZE) { chunks.push(...) }
    // Com CHUNK_SIZE = 1000 e value = 'small-value' (tamanho 11):
    // loops 1 vez, chunks = ['small-value'].
    // Então ele grava: 'my-key_chunk_0' = 'small-value' e 'my-key_chunk_count' = '1'.
    expect(mockSet).toHaveBeenCalledWith('my-key_chunk_0', 'small-value');
    expect(mockSet).toHaveBeenCalledWith('my-key_chunk_count', '1');
  });

  it('should chunk and set item if size exceeds 1000 bytes', async () => {
    const mockSet = SecureStore.setItemAsync as jest.Mock;
    const value = 'a'.repeat(2500); // 3 chunks: 1000 + 1000 + 500

    await adapter.setItem('my-key', value);

    expect(mockSet).toHaveBeenCalledWith('my-key_chunk_0', 'a'.repeat(1000));
    expect(mockSet).toHaveBeenCalledWith('my-key_chunk_1', 'a'.repeat(1000));
    expect(mockSet).toHaveBeenCalledWith('my-key_chunk_2', 'a'.repeat(500));
    expect(mockSet).toHaveBeenCalledWith('my-key_chunk_count', '3');
  });

  it('should handle error when setting item', async () => {
    const mockSet = SecureStore.setItemAsync as jest.Mock;
    mockSet.mockRejectedValue(new Error('Write failure'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(adapter.setItem('my-key', 'value')).rejects.toThrow('Write failure');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should remove standard item and chunk items on removeItem', async () => {
    const mockGet = SecureStore.getItemAsync as jest.Mock;
    mockGet.mockResolvedValue('2'); // chunk count = 2
    const mockDelete = SecureStore.deleteItemAsync as jest.Mock;

    await adapter.removeItem('my-key');

    expect(mockDelete).toHaveBeenCalledWith('my-key_chunk_0');
    expect(mockDelete).toHaveBeenCalledWith('my-key_chunk_1');
    expect(mockDelete).toHaveBeenCalledWith('my-key_chunk_count');
    expect(mockDelete).toHaveBeenCalledWith('my-key');
  });

  it('should handle error when removing item', async () => {
    const mockGet = SecureStore.getItemAsync as jest.Mock;
    mockGet.mockRejectedValue(new Error('Delete failure'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await adapter.removeItem('my-key');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should remove item successfully when no chunks exist', async () => {
    const mockGet = SecureStore.getItemAsync as jest.Mock;
    mockGet.mockResolvedValue(null);
    const mockDelete = SecureStore.deleteItemAsync as jest.Mock;

    await adapter.removeItem('my-key');

    expect(mockDelete).toHaveBeenCalledWith('my-key');
    expect(mockDelete).not.toHaveBeenCalledWith('my-key_chunk_count');
  });

  it('should fallback to empty string when environment variables are not defined', () => {
    const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => {
      jest.isolateModules(() => {
        require('../../../data/datasources/supabase/client');
      });
    }).toThrow('supabaseUrl is required.');

    process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  });
});

