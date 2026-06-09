
-- =====================================================================
-- 1. document_template_fields
-- =====================================================================
DROP POLICY IF EXISTS "Public all fields" ON public.document_template_fields;
CREATE POLICY "Authenticated manage template fields"
  ON public.document_template_fields FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
REVOKE ALL ON public.document_template_fields FROM anon;

-- =====================================================================
-- 2. document_templates
-- =====================================================================
DROP POLICY IF EXISTS "Public delete templates" ON public.document_templates;
DROP POLICY IF EXISTS "Public insert templates" ON public.document_templates;
DROP POLICY IF EXISTS "Public select templates" ON public.document_templates;
DROP POLICY IF EXISTS "Public update templates" ON public.document_templates;
CREATE POLICY "Authenticated read templates"
  ON public.document_templates FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
CREATE POLICY "Authenticated insert templates"
  ON public.document_templates FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Authenticated update templates"
  ON public.document_templates FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete templates"
  ON public.document_templates FOR DELETE TO authenticated
  USING (true);
REVOKE ALL ON public.document_templates FROM anon;

-- =====================================================================
-- 3. generated_documents
-- =====================================================================
DROP POLICY IF EXISTS "Public all generated" ON public.generated_documents;
CREATE POLICY "Authenticated manage generated docs"
  ON public.generated_documents FOR ALL TO authenticated
  USING (deleted_at IS NULL) WITH CHECK (true);
REVOKE ALL ON public.generated_documents FROM anon;

-- =====================================================================
-- 4. products / product_purchases
-- =====================================================================
DROP POLICY IF EXISTS "Anyone can manage products" ON public.products;
CREATE POLICY "Authenticated manage products"
  ON public.products FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
REVOKE ALL ON public.products FROM anon;

DROP POLICY IF EXISTS "Anyone can manage product purchases" ON public.product_purchases;
CREATE POLICY "Authenticated manage product purchases"
  ON public.product_purchases FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
REVOKE ALL ON public.product_purchases FROM anon;

-- =====================================================================
-- 5. profiles — own row only (admins see all)
-- =====================================================================
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'::app_role));
REVOKE ALL ON public.profiles FROM anon;

-- =====================================================================
-- 6. service_orders
-- =====================================================================
DROP POLICY IF EXISTS "Anyone can delete service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Anyone can insert service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Anyone can update service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Anyone can view service orders" ON public.service_orders;
CREATE POLICY "Authenticated read service orders"
  ON public.service_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert service orders"
  ON public.service_orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update service orders"
  ON public.service_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete service orders"
  ON public.service_orders FOR DELETE TO authenticated USING (true);
REVOKE ALL ON public.service_orders FROM anon;

-- =====================================================================
-- 7. staff
-- =====================================================================
DROP POLICY IF EXISTS "Public select" ON public.staff;
DROP POLICY IF EXISTS "Public insert" ON public.staff;
DROP POLICY IF EXISTS "Public update" ON public.staff;
DROP POLICY IF EXISTS "Public delete" ON public.staff;
CREATE POLICY "Authenticated read staff"
  ON public.staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert staff"
  ON public.staff FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update staff"
  ON public.staff FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated delete staff"
  ON public.staff FOR DELETE TO authenticated USING (true);
REVOKE ALL ON public.staff FROM anon;

-- =====================================================================
-- 8. staff_equipment
-- =====================================================================
DROP POLICY IF EXISTS "Public select" ON public.staff_equipment;
DROP POLICY IF EXISTS "Public insert" ON public.staff_equipment;
DROP POLICY IF EXISTS "Public update" ON public.staff_equipment;
DROP POLICY IF EXISTS "Public delete" ON public.staff_equipment;
CREATE POLICY "Authenticated manage staff equipment"
  ON public.staff_equipment FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.staff_equipment FROM anon;

-- =====================================================================
-- 9. staff_trainings
-- =====================================================================
DROP POLICY IF EXISTS "Public select" ON public.staff_trainings;
DROP POLICY IF EXISTS "Public insert" ON public.staff_trainings;
DROP POLICY IF EXISTS "Public update" ON public.staff_trainings;
DROP POLICY IF EXISTS "Public delete" ON public.staff_trainings;
CREATE POLICY "Authenticated manage staff trainings"
  ON public.staff_trainings FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.staff_trainings FROM anon;

-- =====================================================================
-- 10. transactions — remove public SELECT
-- =====================================================================
DROP POLICY IF EXISTS "Anyone can view transactions" ON public.transactions;
REVOKE ALL ON public.transactions FROM anon;

-- =====================================================================
-- 11. warehouses — remove anon all-access
-- =====================================================================
DROP POLICY IF EXISTS "Allow all for anon" ON public.warehouses;
REVOKE ALL ON public.warehouses FROM anon;

-- =====================================================================
-- 12. equipment_types
-- =====================================================================
DROP POLICY IF EXISTS "Public select" ON public.equipment_types;
DROP POLICY IF EXISTS "Public insert" ON public.equipment_types;
DROP POLICY IF EXISTS "Public update" ON public.equipment_types;
DROP POLICY IF EXISTS "Public delete" ON public.equipment_types;
CREATE POLICY "Authenticated manage equipment types"
  ON public.equipment_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.equipment_types FROM anon;

-- =====================================================================
-- 13. job_roles / product_models
-- =====================================================================
DROP POLICY IF EXISTS "Users can manage job roles" ON public.job_roles;
CREATE POLICY "Authenticated manage job roles"
  ON public.job_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.job_roles FROM anon;

DROP POLICY IF EXISTS "Users can manage product models" ON public.product_models;
CREATE POLICY "Authenticated manage product models"
  ON public.product_models FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.product_models FROM anon;

-- =====================================================================
-- 14. categories — drop redundant anon SELECT
-- =====================================================================
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
REVOKE ALL ON public.categories FROM anon;

-- =====================================================================
-- 15. Storage policies for private document buckets
-- =====================================================================
DROP POLICY IF EXISTS "Public read template files" ON storage.objects;
DROP POLICY IF EXISTS "Public write template files" ON storage.objects;
DROP POLICY IF EXISTS "Public update template files" ON storage.objects;
DROP POLICY IF EXISTS "Public delete template files" ON storage.objects;

CREATE POLICY "Authenticated read document buckets"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = ANY (ARRAY['document-templates'::text, 'generated-documents'::text]));
CREATE POLICY "Authenticated write document buckets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = ANY (ARRAY['document-templates'::text, 'generated-documents'::text]));
CREATE POLICY "Authenticated update document buckets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = ANY (ARRAY['document-templates'::text, 'generated-documents'::text]))
  WITH CHECK (bucket_id = ANY (ARRAY['document-templates'::text, 'generated-documents'::text]));
CREATE POLICY "Authenticated delete document buckets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = ANY (ARRAY['document-templates'::text, 'generated-documents'::text]));

-- =====================================================================
-- 16. SECURITY DEFINER function hardening
-- =====================================================================
REVOKE EXECUTE ON FUNCTION public.adjust_stock(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

REVOKE EXECUTE ON FUNCTION public.sync_profile_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_single_active_template() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_service_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_warehouse_for_service_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_product_models_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Fix mutable search_path on the one trigger fn that misses it
CREATE OR REPLACE FUNCTION public.update_product_models_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;
