
-- Garante unicidade por nome para tornar a semeadura idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_name_key'
  ) THEN
    ALTER TABLE public.categories ADD CONSTRAINT categories_name_key UNIQUE (name);
  END IF;
END$$;

-- Semeia categorias padrão (não sobrescreve se já existirem)
INSERT INTO public.categories (name, type) VALUES
('01. Proteção de Cabeça','epi'),
('02. Proteção Visual e Facial','epi'),
('03. Proteção Auditiva','epi'),
('04. Proteção Respiratória','epi'),
('05. Camisas','epi'),
('06. Proteção de Tronco','epi'),
('07. Membros Superiores','epi'),
('08. Calças','epi'),
('09. Botas','epi'),
('10. Proteção Contra Queda','epi'),
('11. Ferramentas Manuais','tool'),
('12. Ferramentas Elétricas','tool'),
('13. Equipamentos Diversos','tool'),
('14. Acessórios P/ Ferramentas','tool')
ON CONFLICT (name) DO NOTHING;
