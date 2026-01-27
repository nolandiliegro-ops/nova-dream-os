import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MissionDiff } from "@/utils/missionDiff";

export function useBulkUpdateMissions() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      projectId,
      diffs,
    }: {
      projectId: string;
      diffs: MissionDiff[];
    }) => {
      if (!user) throw new Error("User not authenticated");

      // Filtrer les missions à créer et à mettre à jour
      const toCreate = diffs.filter(d => d.type === 'create');
      const toUpdate = diffs.filter(d => d.type === 'update');

      // Créer les nouvelles missions
      if (toCreate.length > 0) {
        // Get the next order index
        const { data: existingMissions } = await supabase
          .from("missions")
          .select("order_index")
          .eq("project_id", projectId)
          .order("order_index", { ascending: false })
          .limit(1);

        const startIndex = existingMissions?.[0]?.order_index ?? -1;

        const missionsToInsert = toCreate.map((diff, idx) => ({
          project_id: projectId,
          user_id: user.id,
          title: diff.parsedMission.title,
          description: diff.parsedMission.description,
          estimated_duration: diff.parsedMission.estimatedDuration || null,
          status: "pending",
          order_index: startIndex + 1 + idx,
          deadline: null,
        }));

        const { error: insertError } = await supabase
          .from("missions")
          .insert(missionsToInsert as never[]);
        
        if (insertError) throw insertError;
      }

      // Mettre à jour les missions existantes
      if (toUpdate.length > 0) {
        for (const diff of toUpdate) {
          if (!diff.existingMission) continue;

          const updates: {
            description?: string;
            estimated_duration?: string | null;
            updated_at?: string;
          } = {
            updated_at: new Date().toISOString(),
          };

          if (diff.changes?.description) {
            updates.description = diff.parsedMission.description;
          }

          if (diff.changes?.estimatedDuration) {
            updates.estimated_duration = diff.parsedMission.estimatedDuration;
          }

          const { error: updateError } = await supabase
            .from("missions")
            .update(updates)
            .eq("id", diff.existingMission.id);

          if (updateError) throw updateError;
        }
      }

      return {
        created: toCreate.length,
        updated: toUpdate.length,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
    },
  });
}
