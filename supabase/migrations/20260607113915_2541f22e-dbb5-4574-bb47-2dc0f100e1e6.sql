
-- Align document template policies with the rest of the app (public/anon access)

-- Templates table
DROP POLICY IF EXISTS "auth select templates" ON public.document_templates;
DROP POLICY IF EXISTS "auth insert templates" ON public.document_templates;
DROP POLICY IF EXISTS "auth update templates" ON public.document_templates;
DROP POLICY IF EXISTS "auth delete templates" ON public.document_templates;

CREATE POLICY "Public select templates" ON public.document_templates FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Public insert templates" ON public.document_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update templates" ON public.document_templates FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete templates" ON public.document_templates FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_templates TO anon;

-- Template fields
DROP POLICY IF EXISTS "auth all fields" ON public.document_template_fields;
CREATE POLICY "Public all fields" ON public.document_template_fields FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_template_fields TO anon;

-- Generated documents
DROP POLICY IF EXISTS "auth all generated" ON public.generated_documents;
CREATE POLICY "Public all generated" ON public.generated_documents FOR ALL USING (deleted_at IS NULL) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_documents TO anon;

-- Storage policies for buckets (templates + generated)
DROP POLICY IF EXISTS "auth read template files" ON storage.objects;
DROP POLICY IF EXISTS "auth write template files" ON storage.objects;
DROP POLICY IF EXISTS "auth delete template files" ON storage.objects;

CREATE POLICY "Public read template files" ON storage.objects FOR SELECT
  USING (bucket_id IN ('document-templates','generated-documents'));
CREATE POLICY "Public write template files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('document-templates','generated-documents'));
CREATE POLICY "Public update template files" ON storage.objects FOR UPDATE
  USING (bucket_id IN ('document-templates','generated-documents'))
  WITH CHECK (bucket_id IN ('document-templates','generated-documents'));
CREATE POLICY "Public delete template files" ON storage.objects FOR DELETE
  USING (bucket_id IN ('document-templates','generated-documents'));
