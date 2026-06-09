-- Add source_type to distinguish uploaded vs visual-builder templates
ALTER TABLE public.document_templates
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'uploaded_excel',
  ADD COLUMN IF NOT EXISTS builder_config jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Constrain allowed values
ALTER TABLE public.document_templates
  DROP CONSTRAINT IF EXISTS document_templates_source_type_check;

ALTER TABLE public.document_templates
  ADD CONSTRAINT document_templates_source_type_check
  CHECK (source_type IN ('uploaded_excel','visual_builder'));

-- Backfill: any existing row stays as uploaded_excel (already the default)
UPDATE public.document_templates
   SET source_type = 'uploaded_excel'
 WHERE source_type IS NULL;

-- Helpful index for filtering by source in the UI
CREATE INDEX IF NOT EXISTS document_templates_source_type_idx
  ON public.document_templates (source_type)
  WHERE deleted_at IS NULL;