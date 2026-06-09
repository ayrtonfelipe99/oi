DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Authenticated users can manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);