-- Fix mutable search_path in update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;