-- Crear tabla de notificaciones para administradores
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_user', 'user_approved', 'user_rejected', 'user_deleted')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  user_email TEXT,
  user_name TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins pueden ver sus notificaciones
CREATE POLICY "Admins can view their own notifications"
ON public.admin_notifications
FOR SELECT
TO authenticated
USING (
  admin_id = auth.uid() AND 
  public.has_role(auth.uid(), 'admin')
);

-- Política: Solo admins pueden actualizar sus notificaciones (marcar como leídas)
CREATE POLICY "Admins can update their own notifications"
ON public.admin_notifications
FOR UPDATE
TO authenticated
USING (
  admin_id = auth.uid() AND 
  public.has_role(auth.uid(), 'admin')
);

-- Política: Solo admins pueden eliminar sus notificaciones
CREATE POLICY "Admins can delete their own notifications"
ON public.admin_notifications
FOR DELETE
TO authenticated
USING (
  admin_id = auth.uid() AND 
  public.has_role(auth.uid(), 'admin')
);

-- Política: Permitir inserciones desde triggers (service role)
CREATE POLICY "Allow service role inserts"
ON public.admin_notifications
FOR INSERT
WITH CHECK (true);

-- Crear función para notificar a admins cuando hay nuevo usuario
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Obtener todos los admin IDs
  FOR admin_user_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.admin_notifications (
      admin_id,
      type,
      title,
      message,
      user_email,
      user_name
    ) VALUES (
      admin_user_id,
      'new_user',
      '¡Nuevo usuario registrado!',
      'Un nuevo usuario se ha registrado y está esperando aprobación.',
      NEW.email,
      NEW.full_name
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para notificar cuando se crea un nuevo perfil
CREATE TRIGGER on_new_user_notify_admin
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_new_user();

-- Habilitar realtime para notificaciones
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;