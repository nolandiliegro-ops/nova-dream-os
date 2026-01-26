-- V5.1 Migration: Add UNIQUE constraint to prevent duplicate habits per user
-- Step 1: Clean up any existing duplicates (keeping the oldest)
DELETE FROM public.habits h1
USING public.habits h2
WHERE h1.user_id = h2.user_id 
  AND h1.title = h2.title 
  AND h1.created_at > h2.created_at;

-- Step 2: Add UNIQUE constraint on (user_id, title)
ALTER TABLE public.habits 
ADD CONSTRAINT habits_user_id_title_unique UNIQUE (user_id, title);

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id_title 
ON public.habits (user_id, title);