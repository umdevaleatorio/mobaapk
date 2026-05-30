import { SecureStoreService } from '../../../services/secureStoreService';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

describe('SecureStoreService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get item correctly', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('value-123');
    const result = await SecureStoreService.getItem('key-1');
    expect(result).toBe('value-123');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('key-1');
  });

  it('should return null when reading fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Read failed'));
    const result = await SecureStoreService.getItem('key-1');
    expect(result).toBeNull();
    consoleErrorSpy.mockRestore();
  });

  it('should set item correctly', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    await SecureStoreService.setItem('key-1', 'value');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('key-1', 'value');
  });

  it('should delete item correctly', async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    await SecureStoreService.deleteItem('key-1');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key-1');
  });

  it('should throw error when writing fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('Write failed'));
    await expect(SecureStoreService.setItem('key-1', 'value')).rejects.toThrow('Write failed');
    consoleErrorSpy.mockRestore();
  });

  it('should throw error when deleting fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(new Error('Delete failed'));
    await expect(SecureStoreService.deleteItem('key-1')).rejects.toThrow('Delete failed');
    consoleErrorSpy.mockRestore();
  });
});
