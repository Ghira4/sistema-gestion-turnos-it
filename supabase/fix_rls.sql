-- Fix RLS infinito en profiles
-- Eliminar políticas problemáticas
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Función helper que evita el loop (SECURITY DEFINER bypasea RLS)
CREATE OR REPLACE FUNCTION get_my_roles()
RETURNS user_role[] AS $$
  SELECT roles FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Política simple: cada uno ve el suyo, admin/jefe ven todos
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR 'admin' = ANY(get_my_roles())
    OR 'jefe' = ANY(get_my_roles())
  );

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (true);
