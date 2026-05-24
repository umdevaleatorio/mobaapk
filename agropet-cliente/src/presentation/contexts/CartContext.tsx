import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { initDB } from '../../data/datasources/sqlite/database';
import * as SQLite from 'expo-sqlite';

export interface CartItem {
  id: string; // productId do Supabase
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

interface CartContextProps {
  cart: CartItem[];
  addToCart: (product: any, qty?: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
}

export const CartContext = createContext<CartContextProps>({
  cart: [],
  addToCart: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
  total: 0,
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  useEffect(() => {
    initDB()
      .then(database => {
        setDb(database);
        loadCart(database);
      })
      .catch(err => {
        console.error('Failed to initialize SQLite database in CartContext:', err);
      });
  }, []);

  const loadCart = async (database: SQLite.SQLiteDatabase) => {
    try {
      const allRows = await database.getAllAsync<CartItem>('SELECT * FROM cart');
      setCart(allRows || []);
    } catch (error) {
      console.error('Failed to load cart from SQLite:', error);
    }
  };

  const addToCart = async (product: any, qty: number = 1) => {
    if (!db) {
      console.warn('Database is not initialized yet in CartContext.');
      return;
    }
    
    try {
      // Verifica primeiro direto no banco para evitar conflitos (race conditions de async state)
      const existing: any = await db.getFirstAsync('SELECT * FROM cart WHERE id = ?', [product.id]);
      
      if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty <= 0) {
          await db.runAsync('DELETE FROM cart WHERE id = ?', [product.id]);
        } else {
          await db.runAsync('UPDATE cart SET quantity = ? WHERE id = ?', [newQty, product.id]);
        }
      } else if (qty > 0) {
        await db.runAsync(
          'INSERT INTO cart (id, name, price, quantity, image_url) VALUES (?, ?, ?, ?, ?)',
          [product.id, product.name, product.price, qty, product.image_url ?? '']
        );
      }
      
      await loadCart(db);
    } catch (error) {
      console.error('Error adding item to cart SQLite:', error);
    }
  };

  const removeFromCart = async (id: string) => {
    if (!db) return;
    try {
      await db.runAsync('DELETE FROM cart WHERE id = ?', [id]);
      await loadCart(db);
    } catch (error) {
      console.error('Error removing item from cart SQLite:', error);
    }
  };

  const clearCart = async () => {
    if (!db) return;
    try {
      await db.runAsync('DELETE FROM cart');
      await loadCart(db);
    } catch (error) {
      console.error('Error clearing cart SQLite:', error);
    }
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};
