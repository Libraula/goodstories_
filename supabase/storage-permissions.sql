-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('goodstories', 'goodstories')
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the goodstories bucket
-- Allow authenticated users to select objects
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'goodstories');

-- Allow authenticated users to insert objects
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'goodstories' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own objects
CREATE POLICY "Allow users to update their own objects"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'goodstories' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own objects
CREATE POLICY "Allow users to delete their own objects"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'goodstories' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
