import { auditService, log, healthCheck } from '../../../services/auditService';
import { supabase } from '../../../data/datasources/supabase/client';

jest.mock('../../../data/datasources/supabase/client', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

const mockRpc = supabase.rpc as jest.Mock;

describe('auditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should call supabase.rpc with log_audit and correct params', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await log('test.action', { key: 'value' }, 'info');
      expect(mockRpc).toHaveBeenCalledWith('log_audit', {
        p_user_id: null,
        p_action: 'test.action',
        p_metadata: JSON.stringify({ key: 'value' }),
        p_level: 'info',
      });
    });

    it('should use default level as info', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await log('test.action');
      expect(mockRpc).toHaveBeenCalledWith('log_audit', {
        p_user_id: null,
        p_action: 'test.action',
        p_metadata: '{}',
        p_level: 'info',
      });
    });

    it('should format Error metadata correctly', async () => {
      mockRpc.mockResolvedValue({ error: null });
      const err = new Error('crash');
      await log('error.action', err, 'error');
      expect(mockRpc).toHaveBeenCalledWith('log_audit', {
        p_user_id: null,
        p_action: 'error.action',
        p_metadata: JSON.stringify({ message: 'crash', stack: err.stack, name: 'Error' }),
        p_level: 'error',
      });
    });

    it('should format primitive metadata as object', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await log('primitive.action', 'just a string', 'warn');
      expect(mockRpc).toHaveBeenCalledWith('log_audit', {
        p_user_id: null,
        p_action: 'primitive.action',
        p_metadata: JSON.stringify({ value: 'just a string' }),
        p_level: 'warn',
      });
    });

    it('should warn if rpc returns error', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockRpc.mockResolvedValue({ error: new Error('rpc error') });
      await log('failing.action');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[audit] Falha ao registrar failing.action:', expect.any(Error));
      consoleWarnSpy.mockRestore();
    });

    it('should catch thrown errors and warn', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockRpc.mockRejectedValue(new Error('network error'));
      await log('network.action');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[audit] Erro ao registrar network.action:', expect.any(Error));
      consoleWarnSpy.mockRestore();
    });
  });

  describe('healthCheck', () => {
    it('should return health data on success', async () => {
      const expected = { status: 'healthy', db: 'connected', total_orders: 42 };
      mockRpc.mockResolvedValue({ data: expected, error: null });
      const result = await healthCheck();
      expect(result).toEqual(expected);
    });

    it('should return error status when rpc returns an error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: new Error('db down') });
      const result = await healthCheck();
      expect(result).toEqual({ status: 'error', db: 'disconnected', total_orders: 0 });
    });

    it('should return error status when rpc throws', async () => {
      mockRpc.mockRejectedValue(new Error('network fail'));
      const result = await healthCheck();
      expect(result).toEqual({ status: 'error', db: 'disconnected', total_orders: 0 });
    });
  });

  describe('auditService object', () => {
    it('should expose log and healthCheck as methods', () => {
      expect(auditService.log).toBeDefined();
      expect(auditService.healthCheck).toBeDefined();
    });
  });
});
