import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { MissionDiff } from "@/utils/missionDiff";

export interface ImportHistoryEntry {
  projectId: string;
  projectName: string;
  createdCount: number;
  updatedCount: number;
  identicalCount: number;
  totalCount: number;
  changes: Array<{
    type: 'create' | 'update' | 'identical';
    missionTitle: string;
    details?: {
      before?: any;
      after?: any;
    };
  }>;
}

export const useSaveImportHistory = () => {
  const { toast } = useToast();

  const saveImportHistory = async (
    projectId: string,
    projectName: string,
    diffs: MissionDiff[]
  ) => {
    try {
      // Compter les types de modifications
      const createdCount = diffs.filter(d => d.type === 'create').length;
      const updatedCount = diffs.filter(d => d.type === 'update').length;
      const identicalCount = diffs.filter(d => d.type === 'identical').length;
      const totalCount = diffs.length;

      // Préparer les détails des modifications
      const changes = diffs.map(diff => {
        const change: any = {
          type: diff.type,
          missionTitle: diff.parsedMission.title
        };

        // Ajouter les détails pour les missions modifiées
        if (diff.type === 'update' && diff.existingMission) {
          change.details = {
            before: {
              duration: diff.existingMission.estimated_duration,
              description: diff.existingMission.description
            },
            after: {
              duration: diff.parsedMission.estimatedDuration,
              description: diff.parsedMission.description
            }
          };
        }

        return change;
      });

      // Obtenir l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Utilisateur non authentifié");
      }

      // Obtenir le mode actuel
      const mode = localStorage.getItem('nova-mode') || 'work';

      // Insérer dans la table import_history
      const { error } = await supabase
        .from('import_history' as any)
        .insert({
          user_id: user.id,
          project_id: projectId,
          project_name: projectName,
          created_count: createdCount,
          updated_count: updatedCount,
          identical_count: identicalCount,
          total_count: totalCount,
          changes: changes,
          mode: mode
        });

      if (error) {
        console.error("Erreur lors de l'enregistrement de l'historique:", error);
        throw error;
      }

      console.log("✅ Historique d'import enregistré avec succès");
      
      toast({
        title: "📋 Historique enregistré",
        description: `${createdCount} créée(s) • ${updatedCount} modifiée(s) • ${identicalCount} identique(s)`,
      });

      return true;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'historique:", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible d'enregistrer l'historique",
        variant: "destructive",
      });
      return false;
    }
  };

  return { saveImportHistory };
};
