import { supabase } from '../data/datasources/supabase/client';

export type LogLevel = 'info' | 'warn' | 'error';

export interface AuditLogEntry {
  action: string;
  metadata?: Record<string, unknown>;
  level?: LogLevel;
}

function formatMetadata(meta: unknown): Record<string, unknown> {
  if (meta instanceof Error) {
    return { message: meta.message, stack: meta.stack, name: meta.name };
  }
  if (typeof meta === 'object' && meta !== null) {
    return meta as Record<string, unknown>;
  }
  return { value: String(meta) };
}

export async function log(
  action: string,
  metadata?: unknown,
  level: LogLevel = 'info',
): Promise<void> {
  try {
    const { error } = await supabase.rpc('log_audit', {
      p_user_id: null,
      p_action: action,
      p_metadata: metadata ? JSON.stringify(formatMetadata(metadata)) : '{}',
      p_level: level,
    });

    if (error) {
      console.warn(`[audit] Falha ao registrar ${action}:`, error);
    }
  } catch (err) {
    console.warn(`[audit] Erro ao registrar ${action}:`, err);
  }
}

export async function healthCheck(): Promise<{
  status: string;
  db: string;
  total_orders: number;
}> {
  try {
    const { data, error } = await supabase.rpc('health_check');
    if (error) throw error;
    return data as { status: string; db: string; total_orders: number };
  } catch (err) {
    return { status: 'error', db: 'disconnected', total_orders: 0 };
  }
}

export const auditService = { log, healthCheck };
