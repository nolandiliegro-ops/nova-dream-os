import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface MissionHistoryEntry {
  id: string;
  mission_id: string;
  user_id: string;
  action: "created" | "updated" | "deleted" | "restored";
  previous_title?: string;
  previous_description?: string;
  previous_status?: string;
  previous_order_index?: number;
  new_title?: string;
  new_description?: string;
  new_status?: string;
  new_order_index?: number;
  changed_fields: string[];
  created_at: string;
}

/**
 * Returns empty array - mission_history table not available until migration is deployed
 */
export const useMissionHistory = (_missionId: string) => {
  return useQuery({
    queryKey: ["mission-history", _missionId],
    queryFn: async () => {
      // Return empty array - migration not deployed yet
      return [] as MissionHistoryEntry[];
    },
    enabled: !!_missionId,
  });
};

export const useRestoreMissionVersion = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (_params: {
      missionId: string;
      historyEntry: MissionHistoryEntry;
    }) => {
      // Disabled until migration is deployed
      throw new Error("Fonctionnalité non disponible - migration SQL requise");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useEditMissionFromHistory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (_params: {
      missionId: string;
      title?: string;
      description?: string;
      status?: string;
    }) => {
      // Disabled until migration is deployed
      throw new Error("Fonctionnalité non disponible - migration SQL requise");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
