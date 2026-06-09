CREATE OR REPLACE FUNCTION public.adjust_stock(p_product_id uuid, p_delta integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_stock integer;
BEGIN
  UPDATE public.products
     SET current_stock = COALESCE(current_stock, 0) + p_delta
   WHERE id = p_product_id
   RETURNING current_stock INTO new_stock;

  IF new_stock IS NULL THEN
    RAISE EXCEPTION 'Produto % nao encontrado', p_product_id;
  END IF;

  IF new_stock < 0 THEN
    RAISE EXCEPTION 'Estoque insuficiente para o produto %', p_product_id;
  END IF;

  RETURN new_stock;
END;
$$;

GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_stock(uuid, integer) TO service_role;