-- Permissões para a tabela staff
GRANT INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;

-- Criar políticas para permitir escrita por usuários autenticados
CREATE POLICY "Allow insert for authenticated users" ON public.staff FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON public.staff FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON public.staff FOR DELETE USING (auth.role() = 'authenticated');

-- Garantir que staff_trainings também tenha todas as permissões necessárias (já tem uma política ALL, mas reforçando os GRANTs)
GRANT INSERT, UPDATE, DELETE ON public.staff_trainings TO authenticated;
GRANT ALL ON public.staff_trainings TO service_role;
