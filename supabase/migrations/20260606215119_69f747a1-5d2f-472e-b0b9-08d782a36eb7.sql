
CREATE TABLE public.product_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  brand TEXT,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_purchases TO anon, authenticated;
GRANT ALL ON public.product_purchases TO service_role;

ALTER TABLE public.product_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage product purchases"
ON public.product_purchases
FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX idx_product_purchases_product_id ON public.product_purchases(product_id);
CREATE INDEX idx_product_purchases_created_at ON public.product_purchases(created_at DESC);
