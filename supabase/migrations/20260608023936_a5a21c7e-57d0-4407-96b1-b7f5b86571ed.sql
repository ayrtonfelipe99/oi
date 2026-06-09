
-- Tabela de permissões por papel
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);

GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Todos os autenticados podem ler (precisam pra renderizar UI)
CREATE POLICY "role_permissions_select_authenticated"
ON public.role_permissions FOR SELECT
TO authenticated
USING (true);

-- Apenas programador pode escrever
CREATE POLICY "role_permissions_insert_programador"
ON public.role_permissions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'programador'));

CREATE POLICY "role_permissions_update_programador"
ON public.role_permissions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'programador'))
WITH CHECK (public.has_role(auth.uid(), 'programador'));

CREATE POLICY "role_permissions_delete_programador"
ON public.role_permissions FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'programador'));

-- Função para verificar permissão (programador sempre passa)
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'programador')
    OR EXISTS (
      SELECT 1 FROM public.role_permissions rp
      JOIN public.user_roles ur ON ur.role = rp.role
      WHERE ur.user_id = _user_id
        AND rp.permission = _permission
    );
$$;

-- Seed inicial: admin tem tudo (menos users.manage); operador tem o mínimo
INSERT INTO public.role_permissions (role, permission) VALUES
  -- ADMIN: tudo
  ('admin', 'dashboard.view'),
  ('admin', 'epis.view'), ('admin', 'epis.create'), ('admin', 'epis.edit'), ('admin', 'epis.delete'),
  ('admin', 'tools.view'), ('admin', 'tools.create'), ('admin', 'tools.edit'), ('admin', 'tools.delete'),
  ('admin', 'warehouses.view'), ('admin', 'warehouses.create'), ('admin', 'warehouses.edit'), ('admin', 'warehouses.delete'),
  ('admin', 'staff.view'), ('admin', 'staff.create'), ('admin', 'staff.edit'), ('admin', 'staff.delete'), ('admin', 'staff.import'),
  ('admin', 'movements.exit'), ('admin', 'movements.return'), ('admin', 'movements.in'), ('admin', 'movements.transfer'),
  ('admin', 'service_orders.view'), ('admin', 'service_orders.create'), ('admin', 'service_orders.edit'), ('admin', 'service_orders.delete'),
  ('admin', 'settings.categories'), ('admin', 'settings.templates'),
  -- OPERADOR: visualizar + movimentações básicas
  ('operador', 'dashboard.view'),
  ('operador', 'epis.view'),
  ('operador', 'tools.view'),
  ('operador', 'warehouses.view'),
  ('operador', 'staff.view'),
  ('operador', 'movements.exit'), ('operador', 'movements.return'),
  ('operador', 'service_orders.view')
ON CONFLICT (role, permission) DO NOTHING;
