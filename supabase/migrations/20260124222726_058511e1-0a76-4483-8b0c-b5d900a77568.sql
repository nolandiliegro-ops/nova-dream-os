-- Add mode column to user_goals for contextual isolation
ALTER TABLE public.user_goals 
ADD COLUMN mode text NOT NULL DEFAULT 'work';

-- Drop existing unique constraint if it exists
ALTER TABLE public.user_goals 
DROP CONSTRAINT IF EXISTS user_goals_user_id_year_key;

-- Add new unique constraint including mode (one goal per user/year/mode)
ALTER TABLE public.user_goals 
ADD CONSTRAINT user_goals_user_id_year_mode_key 
UNIQUE (user_id, year, mode);

-- Create index for performance on mode filtering
CREATE INDEX IF NOT EXISTS idx_user_goals_mode 
ON public.user_goals(mode);