-- Update the function to set search_path and improve security
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
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- Revoke execute from public to ensure it's only called via trigger
REVOKE EXECUTE ON FUNCTION public.create_warehouse_for_service_order() FROM public;
GRANT EXECUTE ON FUNCTION public.create_warehouse_for_service_order() TO postgres, service_role;
