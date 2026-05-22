import * as SQLite from 'expo-sqlite';

export async function initDB() {
  const db = await SQLite.openDatabaseAsync('agropet_cart.db');
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    -- Carrinho de compras (Persistência Offline-First)
    CREATE TABLE IF NOT EXISTS cart (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      image_url TEXT
    );

    -- Cache de Produtos para Operação Offline
    CREATE TABLE IF NOT EXISTS products_cache (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      image_url TEXT,
      stock INTEGER,
      active INTEGER DEFAULT 1,
      cached_at INTEGER NOT NULL
    );

    -- Cache de Pedidos para Recuperação de Estado e Histórico Offline
    CREATE TABLE IF NOT EXISTS orders_cache (
      id TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      delivery_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      cached_at INTEGER NOT NULL
    );

    -- Fila de Sincronização Offline (Queue Pattern)
    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      table_name TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `);
  
  return db;
}

