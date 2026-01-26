-- Migration : Ajouter une contrainte UNIQUE sur (user_id, title) pour éviter les doublons
-- Date : 2026-01-26
-- Description : Empêche la création de doublons d'habitudes avec le même titre pour un utilisateur

-- Étape 1 : Supprimer les doublons existants (si présents)
-- On garde uniquement la première occurrence de chaque (user_id, title)
DELETE FROM public.habits
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, title) id
  FROM public.habits
  ORDER BY user_id, title, created_at ASC
);

-- Étape 2 : Ajouter la contrainte UNIQUE
ALTER TABLE public.habits
ADD CONSTRAINT habits_user_id_title_unique UNIQUE (user_id, title);

-- Étape 3 : Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_habits_user_id_title ON public.habits(user_id, title);
