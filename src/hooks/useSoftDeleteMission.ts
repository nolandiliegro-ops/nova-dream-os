import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSoftDeleteMission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (missionId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("missions")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq("id", missionId);

      if (error) throw error;
      return missionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Mission supprimée",
        description: "La mission a été déplacée dans la corbeille. Vous pouvez la restaurer pendant 30 jours.",
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
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (missionId: string) => {
      const { error } = await supabase
        .from("missions")
        .update({
          deleted_at: null,
          deleted_by: null,
        })
        .eq("id", missionId);

      if (error) throw error;
      return missionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["deleted-missions"] });
      toast({
        title: "Mission restaurée",
        description: "La mission et ses tâches ont été restaurées avec succès.",
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

export const useDeletedMissions = (projectId?: string) => {
  return useQuery({
    queryKey: ["deleted-missions", projectId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      let query = supabase
        .from("missions")
        .select("*")
        .eq("user_id", user.id)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};
