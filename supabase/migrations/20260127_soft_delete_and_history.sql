-- =============================================
-- V5.5 Nova Life OS - Soft Delete & History System
-- =============================================

-- 1. Ajouter deleted_at aux missions
ALTER TABLE public.missions
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- 2. Ajouter deleted_at aux tasks
ALTER TABLE public.tasks
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL;

-- 3. Créer la table mission_history pour l'historique des modifications
CREATE TABLE public.mission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'restored')),
  
  -- Snapshot des données avant modification
  previous_title TEXT,
  previous_description TEXT,
  previous_status TEXT,
  previous_order_index INTEGER,
  
  -- Nouvelles données après modification
  new_title TEXT,
  new_description TEXT,
  new_status TEXT,
  new_order_index INTEGER,
  
  -- Métadonnées
  changed_fields TEXT[], -- Liste des champs modifiés
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Index pour performance
CREATE INDEX idx_mission_history_mission_id ON public.mission_history(mission_id, created_at DESC);
CREATE INDEX idx_mission_history_user_id ON public.mission_history(user_id);
CREATE INDEX idx_missions_deleted_at ON public.missions(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_tasks_deleted_at ON public.tasks(deleted_at) WHERE deleted_at IS NOT NULL;

-- 5. Activer RLS sur mission_history
ALTER TABLE public.mission_history ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS pour mission_history
CREATE POLICY "Users can view history of their missions" 
  ON public.mission_history FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.missions 
      WHERE missions.id = mission_history.mission_id 
      AND missions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert history for their missions" 
  ON public.mission_history FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.missions 
      WHERE missions.id = mission_history.mission_id 
      AND missions.user_id = auth.uid()
    )
  );

-- 7. Fonction trigger pour enregistrer automatiquement l'historique
CREATE OR REPLACE FUNCTION public.track_mission_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields_array TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Déterminer l'action
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.mission_history (
      mission_id, user_id, action,
      new_title, new_description, new_status, new_order_index,
      changed_fields
    ) VALUES (
      NEW.id, NEW.user_id, 'created',
      NEW.title, NEW.description, NEW.status, NEW.order_index,
      ARRAY['title', 'description', 'status', 'order_index']
    );
    RETURN NEW;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Détecter les champs modifiés
    IF (OLD.title IS DISTINCT FROM NEW.title) THEN
      changed_fields_array := array_append(changed_fields_array, 'title');
    END IF;
    
    IF (OLD.description IS DISTINCT FROM NEW.description) THEN
      changed_fields_array := array_append(changed_fields_array, 'description');
    END IF;
    
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
      changed_fields_array := array_append(changed_fields_array, 'status');
    END IF;
    
    IF (OLD.order_index IS DISTINCT FROM NEW.order_index) THEN
      changed_fields_array := array_append(changed_fields_array, 'order_index');
    END IF;
    
    -- Détecter soft delete
    IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
      changed_fields_array := array_append(changed_fields_array, 'deleted_at');
      
      INSERT INTO public.mission_history (
        mission_id, user_id, action,
        previous_title, previous_description, previous_status, previous_order_index,
        new_title, new_description, new_status, new_order_index,
        changed_fields
      ) VALUES (
        NEW.id, NEW.user_id, 'deleted',
        OLD.title, OLD.description, OLD.status, OLD.order_index,
        NEW.title, NEW.description, NEW.status, NEW.order_index,
        changed_fields_array
      );
      
      RETURN NEW;
    END IF;
    
    -- Détecter restauration
    IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
      changed_fields_array := array_append(changed_fields_array, 'deleted_at');
      
      INSERT INTO public.mission_history (
        mission_id, user_id, action,
        previous_title, previous_description, previous_status, previous_order_index,
        new_title, new_description, new_status, new_order_index,
        changed_fields
      ) VALUES (
        NEW.id, NEW.user_id, 'restored',
        OLD.title, OLD.description, OLD.status, OLD.order_index,
        NEW.title, NEW.description, NEW.status, NEW.order_index,
        changed_fields_array
      );
      
      RETURN NEW;
    END IF;
    
    -- Si des champs ont été modifiés (hors deleted_at)
    IF (array_length(changed_fields_array, 1) > 0) THEN
      INSERT INTO public.mission_history (
        mission_id, user_id, action,
        previous_title, previous_description, previous_status, previous_order_index,
        new_title, new_description, new_status, new_order_index,
        changed_fields
      ) VALUES (
        NEW.id, NEW.user_id, 'updated',
        OLD.title, OLD.description, OLD.status, OLD.order_index,
        NEW.title, NEW.description, NEW.status, NEW.order_index,
        changed_fields_array
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Créer le trigger sur missions
CREATE TRIGGER track_mission_changes_trigger
  AFTER INSERT OR UPDATE ON public.missions
  FOR EACH ROW
  EXECUTE FUNCTION public.track_mission_changes();

-- 9. Fonction pour soft delete en cascade (missions → tasks)
CREATE OR REPLACE FUNCTION public.soft_delete_mission_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la mission est soft deleted, soft delete les tâches liées
  IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
    UPDATE public.tasks
    SET deleted_at = NEW.deleted_at,
        deleted_by = NEW.deleted_by
    WHERE mission_id = NEW.id
    AND deleted_at IS NULL;
  END IF;
  
  -- Si la mission est restaurée, restaurer les tâches liées
  IF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
    UPDATE public.tasks
    SET deleted_at = NULL,
        deleted_by = NULL
    WHERE mission_id = NEW.id
    AND deleted_at IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Créer le trigger pour cascade soft delete
CREATE TRIGGER soft_delete_mission_tasks_trigger
  AFTER UPDATE ON public.missions
  FOR EACH ROW
  EXECUTE FUNCTION public.soft_delete_mission_tasks();

-- 11. Modifier les politiques RLS pour exclure les éléments supprimés par défaut
DROP POLICY IF EXISTS "Users can view own missions" ON public.missions;
CREATE POLICY "Users can view own missions" 
  ON public.missions FOR SELECT 
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- 12. Ajouter une politique pour voir les missions supprimées (optionnel)
CREATE POLICY "Users can view own deleted missions" 
  ON public.missions FOR SELECT 
  USING (auth.uid() = user_id AND deleted_at IS NOT NULL);

-- 13. Modifier les politiques RLS pour les tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks" 
  ON public.tasks FOR SELECT 
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can view own deleted tasks" 
  ON public.tasks FOR SELECT 
  USING (auth.uid() = user_id AND deleted_at IS NOT NULL);

-- 14. Fonction pour supprimer définitivement les missions après 30 jours
CREATE OR REPLACE FUNCTION public.permanent_delete_old_missions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.missions
  WHERE deleted_at IS NOT NULL
  AND deleted_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM public.tasks
  WHERE deleted_at IS NOT NULL
  AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Commentaires
COMMENT ON TABLE public.mission_history IS 'Historique complet des modifications des missions avec possibilité de restauration';
COMMENT ON COLUMN public.missions.deleted_at IS 'Date de suppression logique (soft delete)';
COMMENT ON COLUMN public.tasks.deleted_at IS 'Date de suppression logique (soft delete)';
COMMENT ON FUNCTION public.track_mission_changes() IS 'Enregistre automatiquement toutes les modifications des missions';
COMMENT ON FUNCTION public.soft_delete_mission_tasks() IS 'Soft delete en cascade : missions → tasks';
COMMENT ON FUNCTION public.permanent_delete_old_missions() IS 'Supprime définitivement les missions supprimées depuis plus de 30 jours';
