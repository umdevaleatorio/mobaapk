import { log, healthCheck, auditService } from '../../../services/auditService';

const mockRpc = jest.fn();

jest.mock('../../../data/datasources/supabase/client', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

describe('auditService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('formatMetadata (tested via log)', () => {
    it('should handle Error metadata', async () => {
      mockRpc.mockResolvedValue({ error: null });
      const error = new Error('test error');
      await log('test.action', error);
      expect(mockRpc).toHaveBeenCalledWith('log_audit', {
        p_user_id: null,
        p_action: 'test.action',
        p_metadata: JSON.stringify({
          message: 'test error',
          stack: error.stack,
          name: 'Error',
        }),
        p_level: 'info',
      });
    });

    it('should handle object metadata', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await log('test.action', { key: 'value', count: 42 });
      expect(mockRpc).toHaveBeenCalledWith('log_audit', {
        p_user_id: null,
        p_action: 'test.action',
        p_metadata: JSON.stringify({ key: 'value', count: 42 }),
        p_level: 'info',
      });
    });

    it('should handle scalar metadata', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await log('test.action', 'just a string');
      expect(mockRpc).toHaveBeenCalledWith('log_audit', {
        p_user_id: null,
        p_action: 'test.action',
        p_metadata: JSON.stringify({ value: 'just a string' }),
        p_level: 'info',
      });
    });
  });

  describe('log', () => {
    it('should log with default level (info) when no level provided', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await log('user.login', { userId: '123' });
      expect(mockRpc).toHaveBeenCalledWith('log_audit', {
        p_user_id: null,
        p_action: 'user.login',
        p_metadata: JSON.stringify({ userId: '123' }),
        p_level: 'info',
      });
    });

    it('should log with custom level', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await log('app.error', new Error('crash'), 'error');
      expect(mockRpc).toHaveBeenCalledWith('log_audit', {
        p_user_id: null,
        p_action: 'app.error',
        p_metadata: expect.any(String),
        p_level: 'error',
      });
    });

    it('should log with empty metadata when metadata is undefined', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await log('user.logout');
      expect(mockRpc).toHaveBeenCalledWith('log_audit', {
        p_user_id: null,
        p_action: 'user.logout',
        p_metadata: '{}',
        p_level: 'info',
      });
    });

    it('should log with null metadata', async () => {
      mockRpc.mockResolvedValue({ error: null });
      await log('user.logout', null);
      expect(mockRpc).toHaveBeenCalledWith('log_audit', {
        p_user_id: null,
        p_action: 'user.logout',
        p_metadata: '{}',
        p_level: 'info',
      });
    });

    it('should log a warning when supabase returns an error', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockRpc.mockResolvedValue({ error: new Error('DB error') });
      await log('test.action');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[audit] Falha ao registrar test.action:',
        expect.any(Error)
      );
      consoleWarnSpy.mockRestore();
    });

    it('should catch and warn when supabase.rpc throws', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockRpc.mockRejectedValue(new Error('Network error'));
      await log('test.action');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[audit] Erro ao registrar test.action:',
        expect.any(Error)
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('healthCheck', () => {
    it('should return health data when supabase responds', async () => {
      const mockData = { status: 'ok', db: 'connected', total_orders: 42 };
      mockRpc.mockResolvedValue({ data: mockData, error: null });
      const result = await healthCheck();
      expect(result).toEqual(mockData);
    });

    it('should throw and return error status when supabase.rpc fails', async () => {
      mockRpc.mockResolvedValue({ data: null, error: new Error('DB down') });
      const result = await healthCheck();
      expect(result).toEqual({ status: 'error', db: 'disconnected', total_orders: 0 });
    });

    it('should return error status when supabase.rpc throws', async () => {
      mockRpc.mockRejectedValue(new Error('Network error'));
      const result = await healthCheck();
      expect(result).toEqual({ status: 'error', db: 'disconnected', total_orders: 0 });
    });
  });

  describe('auditService object', () => {
    it('should export log and healthCheck functions', () => {
      expect(auditService.log).toBe(log);
      expect(auditService.healthCheck).toBe(healthCheck);
    });
  });
});
