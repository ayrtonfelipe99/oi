-- Garantir permissões básicas para ambos os papéis
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated, anon;
GRANT ALL ON public.staff TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_trainings TO authenticated, anon;
GRANT ALL ON public.staff_trainings TO service_role;

-- Limpar políticas da tabela staff
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.staff;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.staff;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.staff;
DROP POLICY IF EXISTS "Anyone can view staff" ON public.staff;
DROP POLICY IF EXISTS "All authenticated users can view staff" ON public.staff;

-- Criar novas políticas públicas para staff
CREATE POLICY "Public select" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Public insert" ON public.staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON public.staff FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete" ON public.staff FOR DELETE USING (true);

-- Limpar políticas da tabela staff_trainings
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.staff_trainings;
DROP POLICY IF EXISTS "Public select" ON public.staff_trainings;
DROP POLICY IF EXISTS "Public insert" ON public.staff_trainings;
DROP POLICY IF EXISTS "Public update" ON public.staff_trainings;
DROP POLICY IF EXISTS "Public delete" ON public.staff_trainings;

-- Criar novas políticas públicas para staff_trainings
CREATE POLICY "Public select" ON public.staff_trainings FOR SELECT USING (true);
CREATE POLICY "Public insert" ON public.staff_trainings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON public.staff_trainings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete" ON public.staff_trainings FOR DELETE USING (true);
