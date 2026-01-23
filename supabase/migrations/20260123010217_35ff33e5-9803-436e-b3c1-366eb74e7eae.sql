-- Ajouter la colonne project_id à transactions pour liaison directe
ALTER TABLE public.transactions 
ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Index pour optimiser les requêtes filtrées par projet
CREATE INDEX idx_transactions_project_id ON public.transactions(project_id);