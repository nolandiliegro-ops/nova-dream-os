-- =============================================
-- V2.0 Nova Life OS - Système de Roadmap par Missions
-- =============================================

-- 1. Créer la table missions
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Index pour performance
CREATE INDEX idx_missions_project_id ON public.missions(project_id);
CREATE INDEX idx_missions_user_id ON public.missions(user_id);
CREATE INDEX idx_missions_order ON public.missions(project_id, order_index);

-- 3. Trigger pour updated_at
CREATE TRIGGER handle_missions_updated_at
  BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Activer RLS
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- 5. Politiques RLS strictes
CREATE POLICY "Users can view own missions" 
  ON public.missions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own missions" 
  ON public.missions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own missions" 
  ON public.missions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own missions" 
  ON public.missions FOR DELETE 
  USING (auth.uid() = user_id);

-- 6. Ajouter colonne mission_id dans tasks
ALTER TABLE public.tasks 
ADD COLUMN mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL;

-- 7. Index pour requêtes par mission
CREATE INDEX idx_tasks_mission_id ON public.tasks(mission_id);