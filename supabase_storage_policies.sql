-- Set up Storage policies for the 'images' bucket

-- 1. Allow public access to view files
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');

-- 2. Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');

-- 3. Allow users to update their own files
CREATE POLICY "Users can update their own images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'images' AND auth.uid() = owner);

-- 4. Allow users to delete their own files
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'images' AND auth.uid() = owner);
