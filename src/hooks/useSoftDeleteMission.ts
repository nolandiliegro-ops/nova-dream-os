import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Soft delete mission - temporarily using hard delete until migration is deployed
 * TODO: Revert to soft delete after migration with deleted_at/deleted_by columns
 */
export const useSoftDeleteMission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (missionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Hard delete for now (migration not deployed)
      const { error } = await supabase
        .from("missions")
        .delete()
        .eq("id", missionId);

      if (error) throw error;
      return missionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Mission supprimée",
        description: "La mission a été supprimée.",
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

export const useRestoreMission = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (_missionId: string) => {
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

export const usePermanentDeleteMission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (missionId: string) => {
      const { error } = await supabase
        .from("missions")
        .delete()
        .eq("id", missionId);

      if (error) throw error;
      return missionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deleted-missions"] });
      toast({
        title: "Mission supprimée définitivement",
        description: "La mission a été supprimée de manière permanente.",
        variant: "destructive",
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

/**
 * Returns empty array - soft delete not available until migration is deployed
 */
export const useDeletedMissions = (_projectId?: string) => {
  return useQuery({
    queryKey: ["deleted-missions", _projectId],
    queryFn: async () => {
      // Return empty array - migration not deployed yet
      return [];
    },
  });
};
