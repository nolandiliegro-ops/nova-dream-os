import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserGoal {
  id: string;
  user_id: string;
  year: number;
  annual_revenue_goal: number;
  annual_projects_goal: number;
  created_at: string;
  updated_at: string;
}

export type UserGoalUpdate = Partial<Pick<UserGoal, "annual_revenue_goal" | "annual_projects_goal">>;

export function useUserGoals(year: number = 2026) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_goals", user?.id, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user!.id)
        .eq("year", year)
        .maybeSingle();

      if (error) throw error;

      // If no goals exist, return defaults
      if (!data) {
        return {
          id: "",
          user_id: user!.id,
          year,
          annual_revenue_goal: 1000000,
          annual_projects_goal: 12,
          created_at: "",
          updated_at: "",
        } as UserGoal;
      }

      return data as UserGoal;
    },
    enabled: !!user,
  });
}

export function useUpdateUserGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ year, goals }: { year: number; goals: UserGoalUpdate }) => {
      if (!user) throw new Error("User not authenticated");

      // Check if goals exist for this year
      const { data: existing } = await supabase
        .from("user_goals")
        .select("id")
        .eq("user_id", user.id)
        .eq("year", year)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("user_goals")
          .update(goals)
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from("user_goals")
          .insert({
            user_id: user.id,
            year,
            annual_revenue_goal: goals.annual_revenue_goal ?? 1000000,
            annual_projects_goal: goals.annual_projects_goal ?? 12,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_goals"] });
    },
  });
}
