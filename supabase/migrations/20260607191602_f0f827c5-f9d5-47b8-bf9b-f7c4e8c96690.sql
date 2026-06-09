ALTER TABLE public.products ADD COLUMN IF NOT EXISTS registered_by text;
ALTER TABLE public.product_purchases ADD COLUMN IF NOT EXISTS registered_by text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS registered_by text;