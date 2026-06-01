import * as SQLite from 'expo-sqlite';
import { supabase } from '../supabase/client';

export interface SyncOperation {
  id?: number;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  data_json: string;
  created_at: number;
  synced: number;
}

/**
 * SyncQueueService
 * Responsabilidade Arquitetural: Fila de Sincronização (Queue Pattern) para operações offline.
 * Quando o dispositivo está offline, as operações de persistência e pedidos são empilhadas aqui
 * e processadas em lote (batch background synchronization) ao reestabelecer conectividade.
 */
export class SyncQueueService {
  private db: SQLite.SQLiteDatabase;

  constructor(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  // Enfileira uma operação de mutação
  async enqueue(operation: 'INSERT' | 'UPDATE' | 'DELETE', tableName: string, data: any) {
    await this.db.runAsync(
      'INSERT INTO sync_queue (operation, table_name, data_json, created_at, synced) VALUES (?, ?, ?, ?, 0)',
      [operation, tableName, JSON.stringify(data), Date.now()]
    );
  }

  // Retorna todas as operações pendentes na fila
  async getPendingOperations(): Promise<SyncOperation[]> {
    return await this.db.getAllAsync<SyncOperation>(
      'SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC'
    );
  }

  // Marca uma operação como resolvida/sincronizada e limpa a fila local
  async markAsSynced(id: number) {
    await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  }

  // Orquestração Assíncrona de Sincronização entre SQLite e Supabase
  async synchronize(isOnline: boolean): Promise<boolean> {
    if (!isOnline) return false;

    const pending = await this.getPendingOperations();
    if (pending.length === 0) return true;

    for (const op of pending) {
      try {
        const data = JSON.parse(op.data_json);

        if (op.operation === 'INSERT') {
          const { error } = await supabase.from(op.table_name).insert(data);
          if (error) throw error;
        } else if (op.operation === 'UPDATE') {
          const { error } = await supabase.from(op.table_name).update(data).eq('id', data.id);
          if (error) throw error;
        } else if (op.operation === 'DELETE') {
          const { error } = await supabase.from(op.table_name).delete().eq('id', data.id);
          if (error) throw error;
        }

        await this.markAsSynced(op.id!);
      } catch (error) {
        console.error(`Erro ao sincronizar transação ${op.id} da tabela ${op.table_name}:`, error);
      }
    }
    return true;
  }
}

/**
 * ProductCacheService
 * Responsabilidade Arquitetural: Cache local offline do catálogo de produtos.
 * Permite que a aplicação exiba o catálogo e opere offline-first mesmo em áreas sem conectividade.
 */
export class ProductCacheService {
  private db: SQLite.SQLiteDatabase;

  constructor(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  // Atualiza o cache local com os dados mais recentes do Supabase (Operação Offline-first)
  async saveProductsToCache(products: any[]) {
    // Limpa cache antigo de forma atômica
    await this.db.runAsync('DELETE FROM products_cache');

    for (const product of products) {
      await this.db.runAsync(
        'INSERT INTO products_cache (id, name, price, description, image_url, stock, active, cached_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          product.id,
          product.name,
          product.price,
          product.description || '',
          product.image_url || '',
          product.stock || 0,
          product.active ? 1 : 0,
          Date.now()
        ]
      );
    }
  }

  // Recupera produtos do cache SQLite local quando a rede falhar
  async getCachedProducts(): Promise<any[]> {
    const rows = await this.db.getAllAsync<any>('SELECT * FROM products_cache WHERE active = 1');
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      price: r.price,
      description: r.description,
      image_url: r.image_url,
      stock: r.stock,
      active: r.active === 1,
      cached_at: r.cached_at
    }));
  }
}

/**
 * OrdersCacheService
 * Responsabilidade Arquitetural: Cache local offline do histórico de pedidos.
 */
export class OrdersCacheService {
  private db: SQLite.SQLiteDatabase;

  constructor(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  async saveOrdersToCache(orders: any[]) {
    await this.db.runAsync('DELETE FROM orders_cache');

    for (const order of orders) {
      await this.db.runAsync(
        'INSERT INTO orders_cache (id, status, total, payment_method, delivery_type, created_at, data_json, cached_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          order.id,
          order.status,
          order.total,
          order.payment_method,
          order.delivery_type,
          order.created_at,
          JSON.stringify(order),
          Date.now()
        ]
      );
    }
  }

  async getCachedOrders(): Promise<any[]> {
    const rows = await this.db.getAllAsync<any>('SELECT * FROM orders_cache ORDER BY created_at DESC');
    return rows.map(r => {
      if (r.data_json) {
        try { return JSON.parse(r.data_json); } catch {}
      }
      return r;
    });
  }
}
