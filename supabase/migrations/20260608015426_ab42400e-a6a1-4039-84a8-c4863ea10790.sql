
CREATE OR REPLACE FUNCTION public.prevent_default_category_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.name IN (
    '01. Proteção de Cabeça','02. Proteção Visual e Facial','03. Proteção Auditiva',
    '04. Proteção Respiratória','05. Camisas','06. Proteção de Tronco',
    '07. Membros Superiores','08. Calças','09. Botas','10. Proteção Contra Queda',
    '11. Ferramentas Manuais','12. Ferramentas Elétricas','13. Equipamentos Diversos',
    '14. Acessórios P/ Ferramentas'
  ) THEN
    RAISE EXCEPTION 'Categoria padrão não pode ser excluída: %', OLD.name;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_default_category_delete ON public.categories;
CREATE TRIGGER trg_prevent_default_category_delete
BEFORE DELETE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.prevent_default_category_delete();
