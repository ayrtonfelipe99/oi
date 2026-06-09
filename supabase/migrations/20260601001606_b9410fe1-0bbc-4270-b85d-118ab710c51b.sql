-- Create service orders table if not exists
CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, completed, cancelled
    warehouse_id UUID REFERENCES public.warehouses(id),
    requester_id UUID REFERENCES public.staff(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant permissions for service_orders
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO authenticated;
GRANT ALL ON public.service_orders TO service_role;

-- Enable RLS for service_orders
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for service_orders
CREATE POLICY "Allow all for authenticated users on service_orders" ON public.service_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for service_orders updated_at using existing function handle_updated_at
CREATE TRIGGER update_service_orders_updated_at
BEFORE UPDATE ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Seed some initial warehouses if empty
INSERT INTO public.warehouses (name, location) 
SELECT v.* FROM (VALUES 
    ('Almoxarifado Central', 'Sede'),
    ('Almoxarifado Obra A', 'Canteiro A'),
    ('Almoxarifado Móvel 01', 'Veículo ABC-1234')
) AS v(name, location)
WHERE NOT EXISTS (SELECT 1 FROM public.warehouses LIMIT 1);
