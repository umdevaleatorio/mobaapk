import { SyncQueueService, ProductCacheService } from '../../../data/datasources/sqlite/syncQueue';
import { supabase } from '../../../data/datasources/supabase/client';

// Mock Supabase
jest.mock('../../../data/datasources/supabase/client', () => {
  const mockInsert = jest.fn().mockResolvedValue({ error: null });
  const mockUpdate = jest.fn().mockResolvedValue({ error: null });
  const mockDelete = jest.fn().mockResolvedValue({ error: null });
  const mockFrom = jest.fn().mockImplementation((table: string) => ({
    insert: mockInsert,
    update: (data: any) => ({ eq: () => mockUpdate(data) }),
    delete: () => ({ eq: () => mockDelete() }),
  }));
  return {
    supabase: {
      from: mockFrom,
    },
    mockInsert,
    mockUpdate,
    mockDelete,
    mockFrom,
  };
});

// Import mock references
const { mockInsert, mockUpdate, mockDelete } = require('../../../data/datasources/supabase/client');

describe('SyncQueue & ProductCache Services', () => {
  let dbMock: any;
  let syncQueueService: SyncQueueService;
  let productCacheService: ProductCacheService;

  beforeEach(() => {
    jest.clearAllMocks();

    dbMock = {
      runAsync: jest.fn().mockResolvedValue({ changes: 1, lastInsertRowId: 1 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
    };

    syncQueueService = new SyncQueueService(dbMock);
    productCacheService = new ProductCacheService(dbMock);
  });

  describe('SyncQueueService', () => {
    it('should enqueue a mutation correctly', async () => {
      await syncQueueService.enqueue('INSERT', 'orders', { x: 1 });
      expect(dbMock.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sync_queue'),
        expect.arrayContaining(['INSERT', 'orders', JSON.stringify({ x: 1 }), expect.any(Number)])
      );
    });

    it('should retrieve pending operations', async () => {
      const mockOps = [{ id: 1, operation: 'INSERT', table_name: 'orders', data_json: '{}' }];
      dbMock.getAllAsync.mockResolvedValue(mockOps);

      const res = await syncQueueService.getPendingOperations();
      expect(res).toEqual(mockOps);
      expect(dbMock.getAllAsync).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM sync_queue'));
    });

    it('should mark an operation as synced by deleting it from local database', async () => {
      await syncQueueService.markAsSynced(42);
      expect(dbMock.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM sync_queue'), [42]);
    });

    describe('synchronize', () => {
      it('should return false if offline', async () => {
        const result = await syncQueueService.synchronize(false);
        expect(result).toBe(false);
      });

      it('should return true and do nothing if there are no pending operations', async () => {
        dbMock.getAllAsync.mockResolvedValue([]);
        const result = await syncQueueService.synchronize(true);
        expect(result).toBe(true);
        expect(mockInsert).not.toHaveBeenCalled();
      });

      it('should process pending operations and insert them into Supabase when online', async () => {
        const mockOps = [
          { id: 1, operation: 'INSERT', table_name: 'orders', data_json: JSON.stringify({ id: 'order-1' }) },
          { id: 2, operation: 'UPDATE', table_name: 'other_table', data_json: JSON.stringify({ id: 'other-1' }) },
          { id: 3, operation: 'UPDATE', table_name: 'orders', data_json: JSON.stringify({ id: 'order-2' }) },
        ];
        dbMock.getAllAsync.mockResolvedValue(mockOps);
        mockInsert.mockResolvedValue({ error: null });

        const result = await syncQueueService.synchronize(true);
        expect(result).toBe(true);
        expect(mockInsert).toHaveBeenCalledWith({ id: 'order-1' });
        expect(mockUpdate).toHaveBeenCalledWith({ id: 'other-1' });
        // Checks that synced rows were removed
        expect(dbMock.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM sync_queue'), [1]);
        expect(dbMock.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM sync_queue'), [2]);
        expect(dbMock.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM sync_queue'), [3]);
      });

      it('should process DELETE operations correctly', async () => {
        const mockOps = [
          { id: 5, operation: 'DELETE', table_name: 'orders', data_json: JSON.stringify({ id: 'order-to-delete' }) },
        ];
        dbMock.getAllAsync.mockResolvedValue(mockOps);
        mockDelete.mockResolvedValue({ error: null });

        const result = await syncQueueService.synchronize(true);
        expect(result).toBe(true);
        expect(mockDelete).toHaveBeenCalled();
        expect(dbMock.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM sync_queue'), [5]);
      });

      it('should handle delete error and not mark as synced', async () => {
        const mockOps = [
          { id: 6, operation: 'DELETE', table_name: 'orders', data_json: JSON.stringify({ id: 'order-to-delete' }) },
        ];
        dbMock.getAllAsync.mockResolvedValue(mockOps);
        mockDelete.mockResolvedValue({ error: new Error('delete failed') });

        const result = await syncQueueService.synchronize(true);
        expect(result).toBe(true);
        expect(mockDelete).toHaveBeenCalled();
        expect(dbMock.runAsync).not.toHaveBeenCalledWith(expect.stringContaining('DELETE FROM sync_queue'), [6]);
      });

      it('should handle update error and not mark as synced', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockOps = [
          { id: 7, operation: 'UPDATE', table_name: 'orders', data_json: JSON.stringify({ id: 'order-3' }) },
        ];
        dbMock.getAllAsync.mockResolvedValue(mockOps);
        mockUpdate.mockResolvedValue({ error: new Error('update failed') });

        const result = await syncQueueService.synchronize(true);
        expect(result).toBe(true);
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(dbMock.runAsync).not.toHaveBeenCalledWith(expect.stringContaining('DELETE FROM sync_queue'), [7]);
        consoleErrorSpy.mockRestore();
      });

      it('should process unknown operations by skipping to markAsSynced', async () => {
        const mockOps = [
          { id: 8, operation: 'UNKNOWN', table_name: 'orders', data_json: JSON.stringify({ id: 'unknown-op' }) },
        ];
        dbMock.getAllAsync.mockResolvedValue(mockOps);

        const result = await syncQueueService.synchronize(true);
        expect(result).toBe(true);
        expect(dbMock.runAsync).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM sync_queue'), [8]);
        expect(mockInsert).not.toHaveBeenCalled();
        expect(mockUpdate).not.toHaveBeenCalled();
        expect(mockDelete).not.toHaveBeenCalled();
      });

      it('should catch errors when Supabase insertion fails', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const mockOps = [
          { id: 1, operation: 'INSERT', table_name: 'orders', data_json: JSON.stringify({ id: 'order-1' }) }
        ];
        dbMock.getAllAsync.mockResolvedValue(mockOps);
        mockInsert.mockResolvedValue({ error: new Error('Supabase fail') });

        const result = await syncQueueService.synchronize(true);
        expect(result).toBe(true);
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(dbMock.runAsync).not.toHaveBeenCalledWith(expect.stringContaining('DELETE FROM sync_queue'), [1]);
        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe('OrdersCacheService', () => {
    let ordersCacheService: any;

    beforeEach(() => {
      jest.clearAllMocks();
      const { OrdersCacheService } = require('../../../data/datasources/sqlite/syncQueue');
      ordersCacheService = new OrdersCacheService(dbMock);
    });

    it('should save orders to cache', async () => {
      const mockOrders = [
        { id: 'order-1', status: 'confirmed', total: 100, payment_method: 'pix', delivery_type: 'delivery', created_at: '2026-01-01' },
        { id: 'order-2', status: 'completed', total: 200, payment_method: 'card', delivery_type: 'pickup', created_at: '2026-01-02' },
      ];

      await ordersCacheService.saveOrdersToCache(mockOrders);
      expect(dbMock.runAsync).toHaveBeenCalledWith('DELETE FROM orders_cache');
      expect(dbMock.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO orders_cache'),
        ['order-1', 'confirmed', 100, 'pix', 'delivery', '2026-01-01', JSON.stringify(mockOrders[0]), expect.any(Number)]
      );
      expect(dbMock.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO orders_cache'),
        ['order-2', 'completed', 200, 'card', 'pickup', '2026-01-02', JSON.stringify(mockOrders[1]), expect.any(Number)]
      );
    });

    it('should return cached orders with data_json parsed', async () => {
      const mockRows = [
        { id: 'order-1', status: 'confirmed', total: 100, payment_method: 'pix', delivery_type: 'delivery', created_at: '2026-01-01', data_json: JSON.stringify({ id: 'order-1', parsed: true }), cached_at: 12345 },
      ];
      dbMock.getAllAsync.mockResolvedValue(mockRows);

      const res = await ordersCacheService.getCachedOrders();
      expect(res).toEqual([{ id: 'order-1', parsed: true }]);
    });

    it('should fallback to raw row when data_json is empty', async () => {
      const mockRows = [
        { id: 'order-1', status: 'confirmed', total: 100, data_json: null, cached_at: 12345 },
      ];
      dbMock.getAllAsync.mockResolvedValue(mockRows);

      const res = await ordersCacheService.getCachedOrders();
      expect(res).toEqual(mockRows);
    });

    it('should fallback to raw row when data_json is invalid JSON', async () => {
      const mockRows = [
        { id: 'order-1', data_json: '{invalid}', cached_at: 12345 },
      ];
      dbMock.getAllAsync.mockResolvedValue(mockRows);

      const res = await ordersCacheService.getCachedOrders();
      expect(res).toEqual(mockRows);
    });
  });

  describe('ProductCacheService', () => {
    it('should save products to cache', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 10, description: 'desc', image_url: 'url', stock: 5, active: true },
        { id: '2', name: 'Product 2', price: 20 }, // Test defaults
      ];

      await productCacheService.saveProductsToCache(mockProducts);
      expect(dbMock.runAsync).toHaveBeenCalledWith('DELETE FROM products_cache');
      expect(dbMock.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products_cache'),
        ['1', 'Product 1', 10, 'desc', 'url', 5, 1, expect.any(Number)]
      );
      expect(dbMock.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products_cache'),
        ['2', 'Product 2', 20, '', '', 0, 0, expect.any(Number)]
      );
    });

    it('should fetch cached products', async () => {
      const mockRows = [
        { id: '1', name: 'Product 1', price: 10, description: 'desc', image_url: 'url', stock: 5, active: 1, cached_at: 12345 },
        { id: '2', name: 'Product 2', price: 20, description: '', image_url: '', stock: 0, active: 0, cached_at: 12345 },
      ];
      dbMock.getAllAsync.mockResolvedValue(mockRows);

      const res = await productCacheService.getCachedProducts();
      expect(res).toEqual([
        { id: '1', name: 'Product 1', price: 10, description: 'desc', image_url: 'url', stock: 5, active: true, cached_at: 12345 },
        { id: '2', name: 'Product 2', price: 20, description: '', image_url: '', stock: 0, active: false, cached_at: 12345 },
      ]);
    });
  });
});
