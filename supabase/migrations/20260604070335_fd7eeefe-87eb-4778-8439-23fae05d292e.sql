-- Tabela de Tipos de Equipamentos (EPI ou Ferramenta)
CREATE TABLE public.equipment_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('epi', 'tool')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Posse de Equipamentos por Colaborador
CREATE TABLE public.staff_equipment (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    equipment_type_id UUID NOT NULL REFERENCES public.equipment_types(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'returned')),
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    return_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_types TO authenticated, anon;
GRANT ALL ON public.equipment_types TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_equipment TO authenticated, anon;
GRANT ALL ON public.staff_equipment TO service_role;

-- RLS
ALTER TABLE public.equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select" ON public.equipment_types FOR SELECT USING (true);
CREATE POLICY "Public insert" ON public.equipment_types FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON public.equipment_types FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete" ON public.equipment_types FOR DELETE USING (true);

CREATE POLICY "Public select" ON public.staff_equipment FOR SELECT USING (true);
CREATE POLICY "Public insert" ON public.staff_equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON public.staff_equipment FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete" ON public.staff_equipment FOR DELETE USING (true);

-- Dados iniciais básicos
INSERT INTO public.equipment_types (name, category) VALUES 
('Capacete de Segurança', 'epi'),
('Bota de Segurança', 'epi'),
('Luva de Proteção', 'epi'),
('Óculos de Proteção', 'epi'),
('Furadeira', 'tool'),
('Martelo', 'tool'),
('Chave de Fenda', 'tool'),
('Multímetro', 'tool');
