
CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('epi','tool','other')),
  description text,
  version text NOT NULL DEFAULT '1',
  is_active boolean NOT NULL DEFAULT false,
  mapping_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  original_file_name text NOT NULL,
  file_extension text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'document-templates',
  storage_path text NOT NULL,
  checksum text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_templates TO authenticated;
GRANT ALL ON public.document_templates TO service_role;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth select templates" ON public.document_templates
  FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY "auth insert templates" ON public.document_templates
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update templates" ON public.document_templates
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete templates" ON public.document_templates
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.enforce_single_active_template()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.document_templates
       SET is_active = false
     WHERE type = NEW.type
       AND id <> NEW.id
       AND is_active = true;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_single_active_template
  BEFORE INSERT OR UPDATE OF is_active ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_active_template();

CREATE TABLE public.document_template_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.document_templates(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  field_label text NOT NULL,
  cell_reference text,
  table_column text,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_template_fields TO authenticated;
GRANT ALL ON public.document_template_fields TO service_role;
ALTER TABLE public.document_template_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth all fields" ON public.document_template_fields
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.generated_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.document_templates(id) ON DELETE SET NULL,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('epi','tool','other')),
  template_type text NOT NULL,
  template_name_snapshot text NOT NULL,
  version_used text NOT NULL,
  original_file_name text NOT NULL,
  generated_file_name text NOT NULL,
  file_extension text NOT NULL,
  mime_type text NOT NULL,
  storage_bucket text NOT NULL DEFAULT 'generated-documents',
  storage_path text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'success',
  generated_by uuid REFERENCES auth.users(id),
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_documents TO authenticated;
GRANT ALL ON public.generated_documents TO service_role;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth all generated" ON public.generated_documents
  FOR ALL TO authenticated USING (deleted_at IS NULL) WITH CHECK (true);

CREATE TRIGGER trg_generated_documents_updated_at
  BEFORE UPDATE ON public.generated_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "auth read template files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'document-templates');

CREATE POLICY "auth write template files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'document-templates');

CREATE POLICY "auth delete template files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'document-templates');

CREATE POLICY "auth read generated files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'generated-documents');

CREATE POLICY "auth write generated files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'generated-documents');
