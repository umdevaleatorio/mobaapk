export interface DBUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'client';
  phone?: string;
  avatarUrl?: string;
  push_token?: string;
  created_at?: string;
}

export interface DBProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
  image_url: string; // JSON array or single string
  description?: string;
  category_id?: string;
  created_at?: string;
}

export interface DBOrder {
  id: string;
  client_id: string;
  total_amount: number;
  shipping_fee: number;
  status: 'confirmed' | 'completed' | 'cancelled';
  delivery_address: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface DBOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  created_at?: string;
}

export interface DBStoreSettings {
  id: string;
  show_greeting_bar: boolean;
  is_open: boolean;
  yellow_stock_margin: number;
  red_stock_margin: number;
  created_at?: string;
}

export interface DBAgropetStoreLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at?: string;
}
