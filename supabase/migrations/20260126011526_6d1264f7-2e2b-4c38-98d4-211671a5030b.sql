-- Drop the existing segment check constraint to allow dynamic user-defined segments
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_segment_check;

-- Also drop any similar constraints on other tables if they exist
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_segment_check;
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_segment_check;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_segment_check;