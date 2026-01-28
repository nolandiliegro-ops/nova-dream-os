-- Créer la table import_history pour stocker l'historique des imports de roadmap
CREATE TABLE IF NOT EXISTS public.import_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  
  -- Statistiques de l'import
  created_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  identical_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  
  -- Détails des modifications (JSON)
  changes jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  -- Métadonnées
  created_at timestamptz NOT NULL DEFAULT now(),
  mode text NOT NULL DEFAULT 'work'
);

-- Commentaires
COMMENT ON TABLE public.import_history IS 'Historique des imports de roadmap avec détails des modifications';
COMMENT ON COLUMN public.import_history.changes IS 'Array JSON des modifications détaillées (missions créées, modifiées, identiques)';

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_import_history_user_id ON public.import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_import_history_project_id ON public.import_history(project_id);
CREATE INDEX IF NOT EXISTS idx_import_history_created_at ON public.import_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_history_mode ON public.import_history(mode);

-- RLS (Row Level Security)
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir leur propre historique
CREATE POLICY "Users can view their own import history"
  ON public.import_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent insérer leur propre historique
CREATE POLICY "Users can insert their own import history"
  ON public.import_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent supprimer leur propre historique
CREATE POLICY "Users can delete their own import history"
  ON public.import_history
  FOR DELETE
  USING (auth.uid() = user_id);