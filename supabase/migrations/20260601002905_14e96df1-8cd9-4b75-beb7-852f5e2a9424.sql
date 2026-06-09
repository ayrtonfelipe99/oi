-- Grant access to the service_orders table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO authenticated;
GRANT ALL ON public.service_orders TO service_role;

-- Drop existing policies to start fresh and avoid conflicts
DROP POLICY IF EXISTS "Allow all for authenticated users on service_orders" ON public.service_orders;
DROP POLICY IF EXISTS "Authenticated users can view service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Authenticated users can insert service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Authenticated users can update service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Authenticated users can delete service orders" ON public.service_orders;

-- Create simple policies for all users (anon and authenticated)
-- This ensures that the RLS policy error is resolved regardless of auth status
CREATE POLICY "Anyone can view service orders" 
ON public.service_orders FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert service orders" 
ON public.service_orders FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update service orders" 
ON public.service_orders FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete service orders" 
ON public.service_orders FOR DELETE 
USING (true);
