-- Allow anon to view categories
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
GRANT SELECT ON public.categories TO anon;

-- Allow anon to view products
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
GRANT SELECT ON public.products TO anon;

-- Allow anon to view transactions
CREATE POLICY "Anyone can view transactions" ON public.transactions FOR SELECT USING (true);
GRANT SELECT ON public.transactions TO anon;

-- Allow anon to view staff (needed for transaction/OS details)
CREATE POLICY "Anyone can view staff" ON public.staff FOR SELECT USING (true);
GRANT SELECT ON public.staff TO anon;
