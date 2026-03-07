-- Storage policies for 'prompt-images' bucket
-- Run this in Supabase SQL Editor AFTER creating the 'prompt-images' bucket in Storage.

-- 1. Public read access (allows images to be loaded in the browser)
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'prompt-images');

-- 2. Authenticated users can upload
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'prompt-images');

-- 3. Users can update their own files (path prefix = user_id)
CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'prompt-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Users can delete their own files
CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'prompt-images' AND auth.uid()::text = (storage.foldername(name))[1]);
