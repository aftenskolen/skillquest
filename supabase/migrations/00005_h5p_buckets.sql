-- H5P: bucket for opplastede .h5p-filer (originale)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('h5p-filer', 'h5p-filer', true, 104857600)  -- 100 MB
ON CONFLICT (id) DO NOTHING;

-- H5P: bucket for utpakket innhold (serveres til h5p-standalone)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('h5p-innhold', 'h5p-innhold', true, 104857600)
ON CONFLICT (id) DO NOTHING;

-- RLS-policyer (service_role trenger ikke disse, men anon-lesing trenger dem)
CREATE POLICY "h5p-filer-les" ON storage.objects
  FOR SELECT USING (bucket_id = 'h5p-filer');

CREATE POLICY "h5p-innhold-les" ON storage.objects
  FOR SELECT USING (bucket_id = 'h5p-innhold');
