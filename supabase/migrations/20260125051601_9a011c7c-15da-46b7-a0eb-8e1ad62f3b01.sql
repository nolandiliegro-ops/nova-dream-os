-- 1. Rendre project_id nullable dans missions
ALTER TABLE public.missions 
ALTER COLUMN project_id DROP NOT NULL;

-- 2. Mettre à jour le mode des missions existantes basé sur leur projet
UPDATE public.missions m
SET is_focus = COALESCE(m.is_focus, false)
WHERE m.project_id IS NOT NULL;