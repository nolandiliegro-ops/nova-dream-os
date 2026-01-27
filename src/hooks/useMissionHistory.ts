import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

export const useMissionHistory = (missionId: string) => {
  return useQuery({
    queryKey: ["mission-history", missionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mission_history")
        .select("*")
        .eq("mission_id", missionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MissionHistoryEntry[];
    },
    enabled: !!missionId,
  });
};

export const useRestoreMissionVersion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      missionId,
      historyEntry,
    }: {
      missionId: string;
      historyEntry: MissionHistoryEntry;
    }) => {
      // Restaurer la mission avec les données de l'historique
      const updateData: any = {};

      if (historyEntry.previous_title) {
        updateData.title = historyEntry.previous_title;
      }
      if (historyEntry.previous_description !== undefined) {
        updateData.description = historyEntry.previous_description;
      }
      if (historyEntry.previous_status) {
        updateData.status = historyEntry.previous_status;
      }
      if (historyEntry.previous_order_index !== undefined) {
        updateData.order_index = historyEntry.previous_order_index;
      }

      const { error } = await supabase
        .from("missions")
        .update(updateData)
        .eq("id", missionId);

      if (error) throw error;
      return missionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      queryClient.invalidateQueries({ queryKey: ["mission-history"] });
      toast({
        title: "Version restaurée",
        description: "La mission a été restaurée à cette version.",
      });
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
    mutationFn: async ({
      missionId,
      title,
      description,
      status,
    }: {
      missionId: string;
      title?: string;
      description?: string;
      status?: string;
    }) => {
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (status !== undefined) updateData.status = status;

      const { error } = await supabase
        .from("missions")
        .update(updateData)
        .eq("id", missionId);

      if (error) throw error;
      return missionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      queryClient.invalidateQueries({ queryKey: ["mission-history"] });
      toast({
        title: "Mission modifiée",
        description: "Les modifications ont été enregistrées dans l'historique.",
      });
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
