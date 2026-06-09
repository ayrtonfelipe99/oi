ALTER TABLE public.staff ADD COLUMN cost_center TEXT;
COMMENT ON COLUMN public.staff.cost_center IS 'Centro de Custo ou Ordem de Serviço vinculada ao colaborador';
