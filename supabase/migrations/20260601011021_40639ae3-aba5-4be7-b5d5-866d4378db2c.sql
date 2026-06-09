-- Adicionar política para inserção
CREATE POLICY "Authenticated users can insert warehouses"
ON public.warehouses
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Adicionar política para atualização
CREATE POLICY "Authenticated users can update warehouses"
ON public.warehouses
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Adicionar política para exclusão
CREATE POLICY "Authenticated users can delete warehouses"
ON public.warehouses
FOR DELETE
TO authenticated
USING (true);
