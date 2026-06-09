CREATE TABLE public.trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.staff_trainings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
    training_id UUID REFERENCES public.trainings(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainings TO authenticated;
GRANT ALL ON public.trainings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_trainings TO authenticated;
GRANT ALL ON public.staff_trainings TO service_role;

-- RLS
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON public.trainings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.staff_trainings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert some default trainings
INSERT INTO public.trainings (name) VALUES 
('NR-10 Segurança em Instalações e Serviços em Eletricidade'),
('NR-35 Trabalho em Altura'),
('NR-33 Segurança e Saúde no Trabalho em Espaços Confinados'),
('NR-12 Segurança no Trabalho em Máquinas e Equipamentos'),
('Primeiros Socorros'),
('Operação de Empilhadeira');
