GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;

-- Remover políticas existentes de inserção para evitar conflitos se necessário
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.staff;

-- Recriar política de inserção garantindo permissão para autenticados
CREATE POLICY "Allow insert for authenticated users" ON public.staff 
FOR INSERT TO authenticated 
WITH CHECK (true);
