-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon, public;

-- Grant all on the table to everyone
GRANT ALL ON public.warehouses TO authenticated;
GRANT ALL ON public.warehouses TO anon;
GRANT ALL ON public.warehouses TO public;
GRANT ALL ON public.warehouses TO service_role;

-- Ensure RLS is still permissive
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.warehouses;
DROP POLICY IF EXISTS "Allow all for anon" ON public.warehouses;

CREATE POLICY "Allow all for authenticated"
ON public.warehouses
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all for anon"
ON public.warehouses
FOR ALL
TO anon
USING (true)
WITH CHECK (true);
