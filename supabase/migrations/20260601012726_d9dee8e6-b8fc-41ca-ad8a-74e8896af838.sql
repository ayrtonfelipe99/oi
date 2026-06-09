-- Drop existing policies to ensure a clean state
DROP POLICY IF EXISTS "Authenticated users can insert warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can view warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can update warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can delete warehouses" ON public.warehouses;

-- Create robust policies for authenticated users
CREATE POLICY "Authenticated users can insert warehouses"
ON public.warehouses
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can view warehouses"
ON public.warehouses
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update warehouses"
ON public.warehouses
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete warehouses"
ON public.warehouses
FOR DELETE
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

-- Grant permissions explicitly
GRANT ALL ON public.warehouses TO authenticated;
GRANT ALL ON public.warehouses TO service_role;
