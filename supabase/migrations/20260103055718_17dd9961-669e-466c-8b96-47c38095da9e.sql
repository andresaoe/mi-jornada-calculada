-- Add active column to profiles (default true for existing users)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Create function to check if user is active
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT active FROM public.profiles WHERE id = _user_id),
    false
  )
$$;