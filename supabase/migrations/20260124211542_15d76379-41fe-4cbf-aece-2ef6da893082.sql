-- Add deadline column to missions table
ALTER TABLE public.missions 
ADD COLUMN IF NOT EXISTS deadline DATE DEFAULT NULL;

-- Index for calendar queries
CREATE INDEX IF NOT EXISTS idx_missions_deadline ON public.missions(deadline);