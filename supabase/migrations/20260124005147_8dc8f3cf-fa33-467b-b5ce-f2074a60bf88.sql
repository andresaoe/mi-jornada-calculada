-- Corregir la política de INSERT para que solo sea usada por el trigger (SECURITY DEFINER)
DROP POLICY IF EXISTS "Allow service role inserts" ON public.admin_notifications;

-- Solo el trigger con SECURITY DEFINER puede insertar, no se necesita política de INSERT para usuarios normales