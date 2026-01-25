import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserGoal {
  id: string;
  user_id: string;
  year: number;
  annual_revenue_goal: number;
  annual_projects_goal: number;
  daily_focus_capacity: number; // in minutes, default 360 (6h)
  mode: "work" | "personal";
  created_at: string;
  updated_at: string;
}

export type UserGoalUpdate = Partial<Pick<UserGoal, "annual_revenue_goal" | "annual_projects_goal" | "daily_focus_capacity">>;

export function useUserGoals(year: number = 2026, mode: "work" | "personal" = "work") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_goals", user?.id, year, mode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_goals")
        .select("*")
        .eq("user_id", user!.id)
        .eq("year", year)
        .eq("mode", mode)
        .maybeSingle();

      if (error) throw error;

      // If no goals exist, return defaults based on mode
      if (!data) {
        return {
          id: "",
          user_id: user!.id,
          year,
          mode,
          annual_revenue_goal: mode === "work" ? 1000000 : 50000,
          annual_projects_goal: mode === "work" ? 12 : 6,
          daily_focus_capacity: 360, // 6h default
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
    mutationFn: async ({ year, mode, goals }: { year: number; mode: "work" | "personal"; goals: UserGoalUpdate }) => {
      if (!user) throw new Error("User not authenticated");

      // Check if goals exist for this year AND mode
      const { data: existing } = await supabase
        .from("user_goals")
        .select("id")
        .eq("user_id", user.id)
        .eq("year", year)
        .eq("mode", mode)
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
        // Create new with mode
        const { data, error } = await supabase
          .from("user_goals")
          .insert({
            user_id: user.id,
            year,
            mode,
            annual_revenue_goal: goals.annual_revenue_goal ?? (mode === "work" ? 1000000 : 50000),
            annual_projects_goal: goals.annual_projects_goal ?? (mode === "work" ? 12 : 6),
            daily_focus_capacity: goals.daily_focus_capacity ?? 360,
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
