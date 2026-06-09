ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS admission_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Atualizar metadados do projeto
COMMENT ON COLUMN public.staff.photo_url IS 'URL da foto do colaborador';
COMMENT ON COLUMN public.staff.department IS 'Setor/Departamento do colaborador';
COMMENT ON COLUMN public.staff.admission_date IS 'Data de admissão do colaborador';
