-- Schema Inicial: AgroPet Lambari (Supabase)

-- 1. Criação de Enums
CREATE TYPE user_role AS ENUM ('client', 'admin');
CREATE TYPE order_status AS ENUM ('confirmed', 'preparing', 'delivering', 'completed', 'cancelled');
CREATE TYPE payment_method AS ENUM ('pix', 'dinheiro', 'cartao_credito', 'cartao_debito');
CREATE TYPE category_type AS ENUM ('pet', 'agro');

-- 2. Tabela de Perfil de Usuários (Estende o auth.users do Supabase)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  cep TEXT,
  lat FLOAT,
  lng FLOAT,
  role user_role DEFAULT 'client'::user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS e Politicas Base de Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile." ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin can view all users" ON public.users FOR SELECT USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Trigger para criar perfil de user automaticamente apoś Signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email, 'client');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Tabela de Categorias
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type category_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Produtos
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  stock INTEGER DEFAULT 0 NOT NULL,
  mercado_livre_url TEXT,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Configurações da Loja
CREATE TABLE public.store_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_radius_km DECIMAL(10,2) DEFAULT 17.0,
  opening_time TIME,
  closing_time TIME,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Pedidos (Orders)
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status order_status DEFAULT 'confirmed'::order_status NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  delivery_type TEXT NOT NULL,
  payment_method payment_method NOT NULL,
  delivery_address TEXT,
  lat FLOAT,
  lng FLOAT,
  needs_change TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Itens do Pedido (Order Items)
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);

-- Tabela de Mensagens do Pedido (Order Messages) - ex: Motivos de Cancelamento
CREATE TABLE public.order_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  reason TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Concorrentes (Para o Mapa Admin)
CREATE TABLE public.competitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  phone TEXT
);

-- Políticas RLS básicas de leitura global
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Produtos visíveis a todos." ON public.products FOR SELECT USING (active = true);
CREATE POLICY "Admin controla produtos" ON public.products USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categorias visíveis a todos." ON public.categories FOR SELECT USING (true);

-- Popular o settings com configuração inicial
INSERT INTO public.store_settings (delivery_radius_km, opening_time, closing_time)
VALUES (17.0, '08:00', '18:00');
