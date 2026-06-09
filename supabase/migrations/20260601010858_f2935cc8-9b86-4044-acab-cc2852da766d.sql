-- Function to create a warehouse for a new service order
CREATE OR REPLACE FUNCTION public.create_warehouse_for_service_order()
RETURNS TRIGGER AS $$
DECLARE
    new_warehouse_id UUID;
BEGIN
    -- Create the warehouse
    INSERT INTO public.warehouses (name, location)
    VALUES ('ALMOXARIFADO GERAL - ' || NEW.title, 'Depósito Central')
    RETURNING id INTO new_warehouse_id;

    -- Assign the warehouse_id to the service order being inserted
    NEW.warehouse_id := new_warehouse_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run before inserting a service order
DROP TRIGGER IF EXISTS tr_create_warehouse_on_so_insert ON public.service_orders;
CREATE TRIGGER tr_create_warehouse_on_so_insert
BEFORE INSERT ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION public.create_warehouse_for_service_order();
