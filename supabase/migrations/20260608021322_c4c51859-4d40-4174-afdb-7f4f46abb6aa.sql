DROP TRIGGER IF EXISTS on_service_order_created ON public.service_orders;
DROP TRIGGER IF EXISTS tr_create_warehouse_on_so_insert ON public.service_orders;
DROP FUNCTION IF EXISTS public.handle_new_service_order();
DROP FUNCTION IF EXISTS public.create_warehouse_for_service_order();