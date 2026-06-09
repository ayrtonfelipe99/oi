ALTER TABLE public.product_models ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE public.product_models ADD COLUMN IF NOT EXISTS item_number TEXT;