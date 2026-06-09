CREATE TABLE public.damaged_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  condition text NOT NULL CHECK (condition IN ('recuperavel','descartado')),
  reason text,
  registered_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_damaged_items_warehouse ON public.damaged_items(warehouse_id);
CREATE INDEX idx_damaged_items_product ON public.damaged_items(product_id);
CREATE INDEX idx_damaged_items_created ON public.damaged_items(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.damaged_items TO authenticated;
GRANT ALL ON public.damaged_items TO service_role;

ALTER TABLE public.damaged_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated manage damaged items"
  ON public.damaged_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);