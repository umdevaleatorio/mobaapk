declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): Record<string, string>;
  };
}

declare module 'https://deno.land/std@0.192.0/http/server.ts' {
  export interface ServeHandlerInfo {
    remoteAddr: { transport: 'tcp' | 'udp'; hostname: string; port: number };
  }

  export type ServeHandler = (
    request: Request,
    info: ServeHandlerInfo
  ) => Response | Promise<Response>;

  export function serve(handler: ServeHandler): void;
  export function serve(handler: ServeHandler, options: { port?: number; hostname?: string }): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  interface PostgrestResponse<T = any> {
    data: T | null;
    error: Error | null;
  }

  interface PostgrestFilterBuilder<T = any> extends PromiseLike<PostgrestResponse<T>> {
    eq(column: string, value: unknown): this;
    limit(count: number): this;
    single(): PostgrestFilterBuilder<any>;
  }

  interface PostgrestQueryBuilder {
    select(columns: string): PostgrestFilterBuilder<any[]>;
    update(values: Record<string, unknown>): PostgrestFilterBuilder<null>;
  }

  interface SupabaseClient {
    from(table: string): PostgrestQueryBuilder;
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: { db?: { schema?: string } }
  ): SupabaseClient;
}
