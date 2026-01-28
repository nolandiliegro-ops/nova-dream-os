-- Add text/markdown to allowed MIME types for documents bucket
UPDATE storage.buckets 
SET allowed_mime_types = array_cat(
  allowed_mime_types,
  ARRAY['text/markdown']
)
WHERE id = 'documents';