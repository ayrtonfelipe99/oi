-- Garantir que as categorias existam
INSERT INTO public.categories (name, type) VALUES 
('01. Proteção de Cabeça', 'epi'),
('02. Proteção Visual e Facial', 'epi'),
('03. Proteção Auditiva', 'epi'),
('04. Proteção Respiratória', 'epi'),
('05. Camisas', 'epi'),
('06. Proteção de Tronco', 'epi'),
('07. Membros Superiores', 'epi'),
('08. Calças', 'epi'),
('09. Botas', 'epi'),
('10. Proteção Contra Queda', 'epi'),
('11. Ferramentas Manuais', 'tool'),
('12. Ferramentas Elétricas', 'tool'),
('13. Equipamentos Diversos', 'tool'),
('14. Acessórios P/ Ferramentas', 'tool')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  type = EXCLUDED.type;

-- Atualizar especificamente o nome de '06. Aventais' para '06. Proteção de Tronco' se já existir
UPDATE public.categories SET name = '06. Proteção de Tronco' WHERE name = '06. Aventais' OR name LIKE '06.%';
