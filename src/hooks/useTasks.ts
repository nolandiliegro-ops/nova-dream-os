import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "completed";
  due_date: string | null;
  completed_at: string | null;
  estimated_time: number; // minutes
  time_spent: number; // minutes
  mode: "work" | "personal";
  created_at: string;
  updated_at: string;
}

export type TaskInsert = Omit<Task, "id" | "created_at" | "updated_at">;

export function useTasks(mode?: "work" | "personal") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tasks", mode],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (mode) {
        query = query.eq("mode", mode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });
}

export function useTaskStats(mode?: "work" | "personal") {
  const { data: tasks } = useTasks(mode);

  const stats = {
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    totalEstimatedTime: 0,
    totalTimeSpent: 0,
    roi: 0, // (estimé - passé) / estimé * 100
    overdue: 0,
  };

  if (tasks) {
    const now = new Date();
    stats.total = tasks.length;

    tasks.forEach((t) => {
      if (t.status === "completed") stats.completed++;
      if (t.status === "in_progress") stats.inProgress++;
      if (t.status === "todo") stats.todo++;

      stats.totalEstimatedTime += t.estimated_time;
      stats.totalTimeSpent += t.time_spent;

      if (t.due_date && new Date(t.due_date) < now && t.status !== "completed") {
        stats.overdue++;
      }
    });

    if (stats.totalEstimatedTime > 0) {
      stats.roi =
        ((stats.totalEstimatedTime - stats.totalTimeSpent) /
          stats.totalEstimatedTime) *
        100;
    }
  }

  return stats;
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (task: Omit<TaskInsert, "user_id">) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...task, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useToggleTaskComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          status: completed ? "completed" : "todo",
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
