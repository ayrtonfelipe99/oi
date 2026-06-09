-- Remover a chave estrangeira incorreta
ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS staff_contract_id_fkey;

-- Adicionar a chave estrangeira correta apontando para service_orders
ALTER TABLE public.staff 
ADD CONSTRAINT staff_contract_id_fkey 
FOREIGN KEY (contract_id) 
REFERENCES public.service_orders(id) 
ON DELETE SET NULL;
