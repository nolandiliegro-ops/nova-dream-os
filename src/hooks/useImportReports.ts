import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type ImportReport = Tables<"documents">;

export const useImportReports = (projectId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["import-reports", user?.id, projectId],
    queryFn: async () => {
      if (!user?.id || !projectId) return [];

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .eq("category", "report")
        .ilike("name", `%${projectId}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data as ImportReport[];
    },
    enabled: !!user?.id && !!projectId,
  });
};
