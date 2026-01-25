-- Add estimated_duration column to missions table for time tracking
ALTER TABLE public.missions
ADD COLUMN estimated_duration text DEFAULT NULL;