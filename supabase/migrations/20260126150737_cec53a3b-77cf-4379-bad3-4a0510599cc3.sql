-- Add INSERT policy for admin_notifications
-- Only system triggers (via SECURITY DEFINER functions) should create notifications
-- This policy denies direct INSERT from clients, but allows the trigger function to work
CREATE POLICY "System can insert notifications via trigger"
ON public.admin_notifications
FOR INSERT
WITH CHECK (false);

-- Note: The notify_admin_new_user() function uses SECURITY DEFINER, 
-- so it bypasses RLS and can still insert notifications.
-- This policy ensures no client can directly insert fake notifications.