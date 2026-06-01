import * as SQLite from 'expo-sqlite';

export async function initDB() {
  const db = await SQLite.openDatabaseAsync('agropet_cart.db');
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS cart (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      image_url TEXT
    );

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

    CREATE TABLE IF NOT EXISTS orders_cache (
      id TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      delivery_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      data_json TEXT,
      cached_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      table_name TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `);

  // Migração: adicionar coluna data_json em orders_cache
  // Se já existe, o ALTER é ignorado silenciosamente
  try {
    await db.execAsync('ALTER TABLE orders_cache ADD COLUMN data_json TEXT');
  } catch {
    // Coluna já existe — ignorar
  }
  
  return db;
}

