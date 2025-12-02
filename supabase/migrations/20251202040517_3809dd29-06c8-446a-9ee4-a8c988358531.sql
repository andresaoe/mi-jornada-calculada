-- Add base_salary column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN base_salary numeric NOT NULL DEFAULT 2416500;

-- Add a comment to document the field
COMMENT ON COLUMN public.profiles.base_salary IS 'Base monthly salary used to calculate hourly rate (divided by 220 hours)';