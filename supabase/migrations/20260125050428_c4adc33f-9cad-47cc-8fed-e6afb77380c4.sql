-- Add is_focus column for manual mission prioritization
ALTER TABLE public.missions
ADD COLUMN is_focus boolean NOT NULL DEFAULT false;