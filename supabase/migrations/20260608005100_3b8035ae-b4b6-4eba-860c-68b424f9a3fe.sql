
DROP POLICY IF EXISTS "Admins gerenciam papéis" ON public.user_roles;
CREATE POLICY "Admins e programadores gerenciam papéis"
  ON public.user_roles FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'programador'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'programador'::public.app_role)
  );

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
CREATE POLICY "Users view own profile or admins/programadores see all"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'programador'::public.app_role)
  );
