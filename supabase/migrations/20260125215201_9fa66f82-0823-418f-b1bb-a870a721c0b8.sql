-- Add required_tools column to tasks table for storing tools needed
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS required_tools jsonb DEFAULT '[]'::jsonb;