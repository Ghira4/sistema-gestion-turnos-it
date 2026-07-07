-- Crear bucket para archivos de turnos
INSERT INTO storage.buckets (id, name, public)
VALUES ('archivos-turnos', 'archivos-turnos', false)
ON CONFLICT (id) DO NOTHING;

-- Política: usuarios autenticados pueden subir archivos
CREATE POLICY "upload_archivos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'archivos-turnos');

-- Política: usuarios autenticados pueden ver archivos
CREATE POLICY "read_archivos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'archivos-turnos');
