ALTER TABLE public.equipment_types ADD COLUMN ca_number TEXT;
COMMENT ON COLUMN public.equipment_types.ca_number IS 'Certificado de Aprovação (C.A.) do EPI';