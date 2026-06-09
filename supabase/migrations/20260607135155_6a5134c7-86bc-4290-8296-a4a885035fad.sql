
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS signature_url text,
  ADD COLUMN IF NOT EXISTS movement_group_id uuid,
  ADD COLUMN IF NOT EXISTS material_kind text;

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_material_kind_check;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_material_kind_check
  CHECK (material_kind IS NULL OR material_kind IN ('epi','tool'));

CREATE INDEX IF NOT EXISTS idx_transactions_staff_product_type
  ON public.transactions (staff_id, product_id, type);

CREATE INDEX IF NOT EXISTS idx_transactions_group
  ON public.transactions (movement_group_id);

-- Allow authenticated users to insert transactions (page records movements)
DROP POLICY IF EXISTS "Authenticated can insert transactions" ON public.transactions;
CREATE POLICY "Authenticated can insert transactions"
  ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);

GRANT SELECT, INSERT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
