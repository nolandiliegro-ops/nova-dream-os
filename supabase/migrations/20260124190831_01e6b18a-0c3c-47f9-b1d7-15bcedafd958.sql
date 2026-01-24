-- Add subtasks column to tasks table for sub-task management
ALTER TABLE public.tasks ADD COLUMN subtasks JSONB DEFAULT '[]'::jsonb;