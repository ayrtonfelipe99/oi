-- Create job_roles table
CREATE TABLE public.job_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grant access to roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_roles TO authenticated;
GRANT ALL ON public.job_roles TO service_role;

-- Enable RLS
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage job roles" ON public.job_roles FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_job_roles_updated_at 
BEFORE UPDATE ON public.job_roles 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add role_id to staff table
ALTER TABLE public.staff ADD COLUMN role_id UUID REFERENCES public.job_roles(id);

-- Insert initial data
INSERT INTO public.job_roles (name) VALUES 
('Técnico de Segurança'),
('Almoxarife'),
('Mecânico'),
('Eletricista'),
('Soldador'),
('Auxiliar de Serviços Gerais'),
('Motorista');
