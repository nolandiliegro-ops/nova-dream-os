import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  frequency: string;
  completed_days: string[];
  mode: string;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

// Default habits to create for new users
const DEFAULT_HABITS = [
  { title: "Sport", icon: "dumbbell", color: "segment-ecommerce" },
  { title: "Cours de langue", icon: "book-open", color: "segment-consulting" },
  { title: "Méditation", icon: "brain", color: "segment-oracle" },
  { title: "Sobre", icon: "shield", color: "segment-tiktok" },
];

export function useHabits() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["habits", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Parse completed_days from JSONB
      return (data || []).map((habit) => ({
        ...habit,
        completed_days: Array.isArray(habit.completed_days) 
          ? habit.completed_days as string[]
          : [],
      })) as Habit[];
    },
    enabled: !!user,
  });
}

export function useCreateDefaultHabits() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Vérifier les habitudes existantes pour éviter les doublons
      const { data: existingHabits, error: checkError } = await supabase
        .from("habits")
        .select("title")
        .eq("user_id", user.id);

      if (checkError) throw checkError;

      const existingTitles = new Set(existingHabits?.map(h => h.title) || []);

      // Ne créer que les habitudes qui n'existent pas encore
      const habitsToCreate = DEFAULT_HABITS
        .filter(habit => !existingTitles.has(habit.title))
        .map((habit) => ({
          user_id: user.id,
          title: habit.title,
          icon: habit.icon,
          color: habit.color,
          mode: "personal",
          frequency: "daily",
          completed_days: [],
        }));

      // Si toutes les habitudes existent déjà, ne rien faire
      if (habitsToCreate.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from("habits")
        .insert(habitsToCreate)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });
}

export function useToggleHabitDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      // First, fetch the current habit
      const { data: habit, error: fetchError } = await supabase
        .from("habits")
        .select("completed_days")
        .eq("id", habitId)
        .single();

      if (fetchError) throw fetchError;

      // Parse and toggle the date
      const currentDays = Array.isArray(habit.completed_days) 
        ? (habit.completed_days as string[])
        : [];
      
      const isCompleted = currentDays.includes(date);
      const newDays = isCompleted
        ? currentDays.filter((d) => d !== date)
        : [...currentDays, date];

      // Update the habit
      const { error: updateError } = await supabase
        .from("habits")
        .update({ completed_days: newDays })
        .eq("id", habitId);

      if (updateError) throw updateError;

      return { habitId, date, isCompleted: !isCompleted };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      
      if (result.isCompleted) {
        toast.success("Habitude complétée ! 🎯");
      }
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (habitData: { title: string; icon?: string; color?: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Vérification anti-doublon : vérifier si une habitude avec le même titre existe déjà
      const { data: existingHabits, error: checkError } = await supabase
        .from("habits")
        .select("id, title")
        .eq("user_id", user.id)
        .eq("title", habitData.title);

      if (checkError) throw checkError;

      if (existingHabits && existingHabits.length > 0) {
        throw new Error(`Une habitude "${habitData.title}" existe déjà`);
      }

      const { data, error } = await supabase
        .from("habits")
        .insert({
          user_id: user.id,
          title: habitData.title,
          icon: habitData.icon || "check",
          color: habitData.color || "segment-data",
          mode: "personal",
          frequency: "daily",
          completed_days: [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habitude créée !");
    },
    onError: (error: Error) => {
      if (error.message.includes("existe déjà")) {
        toast.error(error.message);
      } else {
        toast.error("Erreur lors de la création");
      }
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", habitId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habitude supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });
}
