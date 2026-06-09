CREATE TABLE IF NOT EXISTS public.product_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_models TO authenticated;
GRANT ALL ON public.product_models TO service_role;

ALTER TABLE public.product_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage product models" ON public.product_models FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_product_models_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_models_updated_at
BEFORE UPDATE ON public.product_models
FOR EACH ROW
EXECUTE FUNCTION public.update_product_models_updated_at_column();
