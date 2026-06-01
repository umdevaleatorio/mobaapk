import { supabase } from '../data/datasources/supabase/client';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  window_seconds: number;
}

export async function checkRateLimit(
  endpoint: string,
  maxRequests = 10,
  windowSeconds = 60,
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_endpoint: endpoint,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.warn('Rate limit check failed, allowing by default:', error);
      return { allowed: true, remaining: 1, limit: maxRequests, window_seconds: windowSeconds };
    }

    return data as RateLimitResult;
  } catch (err) {
    console.warn('Rate limit service error, allowing by default:', err);
    return { allowed: true, remaining: 1, limit: maxRequests, window_seconds: windowSeconds };
  }
}
