import { checkRateLimit } from '../../../services/rateLimitService';
import { supabase } from '../../../data/datasources/supabase/client';

jest.mock('../../../data/datasources/supabase/client', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

const mockRpc = supabase.rpc as jest.Mock;

describe('rateLimitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return rate limit result on success', async () => {
    const expected = { allowed: true, remaining: 5, limit: 10, window_seconds: 60 };
    mockRpc.mockResolvedValue({ data: expected, error: null });
    const result = await checkRateLimit('test-endpoint', 10, 60);
    expect(result).toEqual(expected);
    expect(mockRpc).toHaveBeenCalledWith('check_rate_limit', {
      p_endpoint: 'test-endpoint',
      p_max_requests: 10,
      p_window_seconds: 60,
    });
  });

  it('should use default values when not provided', async () => {
    mockRpc.mockResolvedValue({ data: { allowed: true, remaining: 10, limit: 10, window_seconds: 60 }, error: null });
    const result = await checkRateLimit('default-endpoint');
    expect(result.allowed).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('check_rate_limit', {
      p_endpoint: 'default-endpoint',
      p_max_requests: 10,
      p_window_seconds: 60,
    });
  });

  it('should allow by default when rpc returns an error', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockRpc.mockResolvedValue({ data: null, error: new Error('rate limit error') });
    const result = await checkRateLimit('failing-endpoint', 5, 30);
    expect(result).toEqual({ allowed: true, remaining: 1, limit: 5, window_seconds: 30 });
    expect(consoleWarnSpy).toHaveBeenCalledWith('Rate limit check failed, allowing by default:', expect.any(Error));
    consoleWarnSpy.mockRestore();
  });

  it('should allow by default when rpc throws', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockRpc.mockRejectedValue(new Error('network error'));
    const result = await checkRateLimit('network-endpoint', 3, 15);
    expect(result).toEqual({ allowed: true, remaining: 1, limit: 3, window_seconds: 15 });
    expect(consoleWarnSpy).toHaveBeenCalledWith('Rate limit service error, allowing by default:', expect.any(Error));
    consoleWarnSpy.mockRestore();
  });
});
