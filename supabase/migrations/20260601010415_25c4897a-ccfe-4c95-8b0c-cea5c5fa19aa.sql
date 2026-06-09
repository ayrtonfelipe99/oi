-- Fix search_path and permissions for the trigger function
ALTER FUNCTION public.handle_new_service_order() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_service_order() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_service_order() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_service_order() FROM authenticated;
-- The trigger will still work because it runs with SECURITY DEFINER and is triggered by the system.
