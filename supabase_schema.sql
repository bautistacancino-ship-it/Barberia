
-- 1. Roles Enum
CREATE TYPE user_role AS ENUM ('client', 'barber', 'admin');

-- 2. Profiles Table (Extends Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'client',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Services Table
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Barbers Table (Linked to Profiles)
CREATE TABLE barbers (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio TEXT,
  is_available BOOLEAN DEFAULT true,
  specialties TEXT[]
);

-- 5. Bookings Table
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES profiles(id) NOT NULL,
  barber_id UUID REFERENCES profiles(id) NOT NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status booking_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Blocked Slots (For lunch, vacations, etc.)
CREATE TABLE blocked_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES profiles(id) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS POLICIES (Row Level Security)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles (to see barbers), but only edit their own.
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Use a non-recursive check for the owner email to avoid infinite recursion
CREATE POLICY "Owner can manage all profiles" ON profiles FOR ALL USING (
  auth.jwt() ->> 'email' = 'bautista.cancino@gmail.com'
);

-- Services: Everyone can view active services.
CREATE POLICY "Services are viewable by everyone" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage all services" ON services FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Bookings: Clients see their own, Barbers see theirs, Admins see all.
CREATE POLICY "Clients can view own bookings" ON bookings FOR SELECT USING (auth.uid() = client_id);
CREATE POLICY "Barbers can view own bookings" ON bookings FOR SELECT USING (auth.uid() = barber_id);
CREATE POLICY "Admins can view all bookings" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Clients can insert bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = client_id);

-- 7. Function for 14-day Alert (Logic for Edge Function)
CREATE OR REPLACE VIEW customers_to_notify AS
SELECT DISTINCT ON (client_id) 
  p.full_name, 
  p.phone, 
  p.id as client_id,
  b.start_time as last_cut_date
FROM bookings b
JOIN profiles p ON b.client_id = p.id
WHERE b.status = 'completed'
  AND b.start_time::date = (CURRENT_DATE - INTERVAL '14 days')::date
ORDER BY client_id, b.start_time DESC;

-- 8. Seed Data (Initial Services and Barbers)
INSERT INTO services (name, description, duration_minutes, price) VALUES
('Corte Clásico', 'Corte tradicional a tijera o máquina con acabado premium.', 30, 15000),
('Perfilado de Barba', 'Diseño y recorte de barba con toalla caliente.', 20, 10000),
('Corte + Barba', 'Servicio completo para un look impecable.', 50, 22000);

-- 9. Automatic Profile Creation (Trigger)
-- This function creates a profile automatically when a new user signs up in Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url', 
    'client'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that fires after a new user is created in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
