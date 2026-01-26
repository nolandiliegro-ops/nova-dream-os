-- First, drop the unique constraint on user_id to allow multiple notes per user
ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_user_id_key;

-- Add new columns for multi-notes system
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Sans titre',
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'yellow';

-- Create index for faster queries on pinned notes
CREATE INDEX IF NOT EXISTS idx_notes_user_pinned ON public.notes(user_id, is_pinned);

-- Add DELETE policy for notes (was missing)
CREATE POLICY "Users can delete own notes" 
ON public.notes 
FOR DELETE 
USING (auth.uid() = user_id);