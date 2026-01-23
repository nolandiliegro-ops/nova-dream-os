-- Drop and recreate the segment check constraint for projects table
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_segment_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_segment_check 
  CHECK (segment IN ('ecommerce', 'tiktok', 'consulting', 'oracle', 'data', 'tech', 'other'));

-- Drop and recreate the segment check constraint for transactions table
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_segment_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_segment_check 
  CHECK (segment IN ('ecommerce', 'tiktok', 'consulting', 'oracle', 'data', 'tech', 'other'));