-- Check if RLS is enabled and enable it
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO authenticated;
GRANT ALL ON public.service_orders TO service_role;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Anyone can create service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Anyone can update service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Anyone can delete service orders" ON public.service_orders;

-- Create permissive policies for authenticated users
-- (Since there is no user_id column in service_orders, we allow all authenticated users)
CREATE POLICY "Authenticated users can view service orders" 
ON public.service_orders 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert service orders" 
ON public.service_orders 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update service orders" 
ON public.service_orders 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete service orders" 
ON public.service_orders 
FOR DELETE 
TO authenticated 
USING (true);