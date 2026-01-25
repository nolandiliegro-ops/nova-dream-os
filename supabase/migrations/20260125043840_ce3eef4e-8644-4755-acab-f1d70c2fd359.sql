-- Add daily focus capacity to user_goals (in minutes, default 6 hours = 360 min)
ALTER TABLE public.user_goals
ADD COLUMN daily_focus_capacity integer NOT NULL DEFAULT 360;

-- Add time_spent tracking to missions (in minutes)
ALTER TABLE public.missions
ADD COLUMN time_spent integer NOT NULL DEFAULT 0;