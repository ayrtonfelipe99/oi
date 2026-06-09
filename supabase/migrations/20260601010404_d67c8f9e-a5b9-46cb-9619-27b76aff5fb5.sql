-- Function to handle new service order creation
CREATE OR REPLACE FUNCTION public.handle_new_service_order()
RETURNS TRIGGER AS $$
DECLARE
    new_warehouse_id UUID;
BEGIN
    -- Only create if warehouse_id is not already set
    IF NEW.warehouse_id IS NULL THEN
        -- Create the warehouse
        INSERT INTO public.warehouses (name, location)
        VALUES ('Almoxarifado Geral - ' || COALESCE(NEW.order_number, NEW.title), 'Vinculado à O.S.')
        RETURNING id INTO new_warehouse_id;

        -- Update the service order with the new warehouse_id
        NEW.warehouse_id := new_warehouse_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new service orders
DROP TRIGGER IF EXISTS on_service_order_created ON public.service_orders;
CREATE TRIGGER on_service_order_created
    BEFORE INSERT ON public.service_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_service_order();

-- Fix existing service orders without warehouses
DO $$
DECLARE
    so_record RECORD;
    new_warehouse_id UUID;
BEGIN
    FOR so_record IN SELECT * FROM public.service_orders WHERE warehouse_id IS NULL LOOP
        INSERT INTO public.warehouses (name, location)
        VALUES ('Almoxarifado Geral - ' || COALESCE(so_record.order_number, so_record.title), 'Vinculado à O.S.')
        RETURNING id INTO new_warehouse_id;

        UPDATE public.service_orders
        SET warehouse_id = new_warehouse_id
        WHERE id = so_record.id;
    END LOOP;
END $$;