-- =============================================
-- SISTEMA GESTION TURNOS IT - Schema inicial
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Tipos enumerados
CREATE TYPE user_role AS ENUM ('admin', 'jefe', 'supervisor', 'vendedor', 'gestor');
CREATE TYPE turno_tipo AS ENUM ('CIE', 'CIUDADANIA', 'PASAPORTE');
CREATE TYPE turno_origen AS ENUM ('asesor', 'redes_sociales', 'ciudadania_italiana');
CREATE TYPE turno_estado AS ENUM ('pendiente', 'confirmado', 'rechazado', 'listo', 'abonado');

-- Perfiles de usuario (extiende auth.users de Supabase)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  roles user_role[] NOT NULL DEFAULT '{vendedor}',
  active_role user_role NOT NULL DEFAULT 'vendedor',
  is_active BOOLEAN NOT NULL DEFAULT true,
  supervisor_id UUID REFERENCES profiles(id),
  comision_porcentaje NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consulados
CREATE TABLE consulados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  pais TEXT NOT NULL DEFAULT 'Italia',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cupones de descuento
CREATE TABLE cupones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  emisor_id UUID REFERENCES profiles(id) NOT NULL,
  receptor_nombre TEXT NOT NULL,
  receptor_contacto TEXT NOT NULL,
  canjeado BOOLEAN DEFAULT false,
  turno_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turnos
CREATE TABLE turnos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consulado_id UUID REFERENCES consulados(id) NOT NULL,
  tipo turno_tipo NOT NULL,
  origen turno_origen NOT NULL,
  cliente_nombre TEXT NOT NULL,
  cliente_contacto TEXT NOT NULL,
  datos_adicionales JSONB DEFAULT '{}',
  cupon_id UUID REFERENCES cupones(id),
  precio_original NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_final NUMERIC(10,2) NOT NULL DEFAULT 0,
  estado turno_estado NOT NULL DEFAULT 'pendiente',
  fecha_solicitud DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_turno DATE,
  fecha_confirmacion DATE,
  vendedor_id UUID REFERENCES profiles(id),
  gestor_id UUID REFERENCES profiles(id),
  archivos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referencia circular: cupones -> turnos
ALTER TABLE cupones ADD CONSTRAINT fk_cupon_turno
  FOREIGN KEY (turno_id) REFERENCES turnos(id);

-- Gastos
CREATE TABLE gastos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  descripcion TEXT NOT NULL,
  monto NUMERIC(10,2) NOT NULL,
  categoria TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  registrado_por UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE consulados ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- Profiles: cada usuario ve el suyo; admins/jefes ven todos
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND ('admin' = ANY(p.roles) OR 'jefe' = ANY(p.roles))
    )
  );

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Consulados: todos pueden ver, solo admin/jefe crean
CREATE POLICY "consulados_select" ON consulados FOR SELECT USING (true);
CREATE POLICY "consulados_insert" ON consulados FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND ('admin' = ANY(p.roles) OR 'jefe' = ANY(p.roles))
    )
  );

-- Cupones: vendedor ve los suyos; supervisor ve los de su equipo
CREATE POLICY "cupones_select" ON cupones FOR SELECT
  USING (
    emisor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        'admin' = ANY(p.roles) OR 'jefe' = ANY(p.roles)
        OR (
          'supervisor' = ANY(p.roles)
          AND emisor_id IN (
            SELECT id FROM profiles WHERE supervisor_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "cupones_insert" ON cupones FOR INSERT
  WITH CHECK (emisor_id = auth.uid());

-- Turnos: todos los roles relevantes pueden ver
CREATE POLICY "turnos_select" ON turnos FOR SELECT USING (true);
CREATE POLICY "turnos_insert" ON turnos FOR INSERT WITH CHECK (true);
CREATE POLICY "turnos_update" ON turnos FOR UPDATE USING (true);

-- Gastos: solo admin/jefe
CREATE POLICY "gastos_select" ON gastos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND ('admin' = ANY(p.roles) OR 'jefe' = ANY(p.roles))
    )
  );

CREATE POLICY "gastos_insert" ON gastos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND ('admin' = ANY(p.roles) OR 'jefe' = ANY(p.roles))
    )
  );

-- =============================================
-- TRIGGER: auto-crear profile al registrar usuario
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
