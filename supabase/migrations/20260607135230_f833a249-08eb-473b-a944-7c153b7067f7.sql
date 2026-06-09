
DROP POLICY IF EXISTS "signatures auth read" ON storage.objects;
DROP POLICY IF EXISTS "signatures auth insert" ON storage.objects;

CREATE POLICY "signatures auth read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'signatures');

CREATE POLICY "signatures auth insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'signatures');
