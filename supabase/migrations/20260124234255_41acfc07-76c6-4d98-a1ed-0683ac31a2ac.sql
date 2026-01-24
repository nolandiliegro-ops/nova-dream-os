-- Drop existing segment check constraint on projects
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_segment_check;

-- Add new segment check constraint with all work + personal segments
ALTER TABLE public.projects ADD CONSTRAINT projects_segment_check 
CHECK (segment = ANY (ARRAY[
  -- Work segments
  'ecommerce'::text, 
  'tiktok'::text, 
  'consulting'::text, 
  'oracle'::text, 
  'data'::text, 
  'tech'::text,
  -- Personal segments
  'hobby'::text,
  'wellness'::text,
  'travel'::text,
  -- Shared
  'other'::text
]));

-- Create index for faster mode-based filtering on documents
CREATE INDEX IF NOT EXISTS idx_documents_mode ON public.documents(mode);

-- Create index for segment filtering
CREATE INDEX IF NOT EXISTS idx_documents_segment ON public.documents(segment);