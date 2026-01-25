import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, addDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

export interface TaskInDay {
  id: string;
  title: string;
  estimatedTime: number;
  missionId?: string | null;
  missionTitle?: string;
}

export interface DayLoadWithTasks {
  day: string;        // "Lun", "Mar", etc.
  date: string;       // "14 janvier"
  fullDate: string;   // "2026-01-14"
  minutes: number;
  hours: number;
  taskCount: number;
  isOverloaded: boolean;
  tasks: TaskInDay[];
}

const STALE_TIME_1_MIN = 60 * 1000;

/**
 * Hook to calculate weekly task load based on individual task durations
 * instead of mission-level estimated_duration
 */
export function useWeeklyTaskLoad(mode: "work" | "personal", dailyCapacity: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tasks", "weekly-load", mode, dailyCapacity],
    staleTime: STALE_TIME_1_MIN,
    queryFn: async () => {
      const today = startOfDay(new Date());
      const weekDates: string[] = [];
      
      // Generate next 7 days
      for (let i = 0; i < 7; i++) {
        weekDates.push(format(addDays(today, i), "yyyy-MM-dd"));
      }

      // Fetch tasks with due_date in the next 7 days for the given mode
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, estimated_time, due_date, mission_id, status")
        .eq("mode", mode)
        .neq("status", "completed")
        .gte("due_date", weekDates[0])
        .lte("due_date", weekDates[6]);

      if (tasksError) throw tasksError;

      // Get unique mission IDs for enrichment
      const missionIds = [...new Set((tasks || [])
        .filter(t => t.mission_id)
        .map(t => t.mission_id!)
      )];

      // Fetch mission titles for context
      let missionMap: Map<string, string> = new Map();
      if (missionIds.length > 0) {
        const { data: missions } = await supabase
          .from("missions")
          .select("id, title")
          .in("id", missionIds);
        
        missionMap = new Map((missions || []).map(m => [m.id, m.title]));
      }

      // Group tasks by date
      const tasksByDate = new Map<string, TaskInDay[]>();
      weekDates.forEach(d => tasksByDate.set(d, []));

      (tasks || []).forEach(task => {
        if (!task.due_date) return;
        const dateKey = task.due_date;
        const existing = tasksByDate.get(dateKey) || [];
        existing.push({
          id: task.id,
          title: task.title,
          estimatedTime: task.estimated_time || 0,
          missionId: task.mission_id,
          missionTitle: task.mission_id ? missionMap.get(task.mission_id) : undefined,
        });
        tasksByDate.set(dateKey, existing);
      });

      // Build the result array
      const result: DayLoadWithTasks[] = weekDates.map((dateStr, index) => {
        const dayDate = addDays(today, index);
        const dayTasks = tasksByDate.get(dateStr) || [];
        const totalMinutes = dayTasks.reduce((sum, t) => sum + t.estimatedTime, 0);

        return {
          day: format(dayDate, "EEE", { locale: fr }).charAt(0).toUpperCase() + 
               format(dayDate, "EEE", { locale: fr }).slice(1, 3),
          date: format(dayDate, "d MMMM", { locale: fr }),
          fullDate: dateStr,
          minutes: totalMinutes,
          hours: Math.round((totalMinutes / 60) * 10) / 10,
          taskCount: dayTasks.length,
          isOverloaded: totalMinutes > dailyCapacity,
          tasks: dayTasks.sort((a, b) => b.estimatedTime - a.estimatedTime),
        };
      });

      return result;
    },
    enabled: !!user,
  });
}

/**
 * Hook to get today's task load
 */
export function useTodayTaskLoad(mode: "work" | "personal") {
  const { user } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["tasks", "today-load", mode],
    staleTime: STALE_TIME_1_MIN,
    queryFn: async () => {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("id, title, estimated_time, status, mission_id")
        .eq("mode", mode)
        .eq("due_date", today);

      if (error) throw error;

      const allTasks = tasks || [];
      const totalMinutes = allTasks.reduce((sum, t) => sum + (t.estimated_time || 0), 0);
      const completedMinutes = allTasks
        .filter(t => t.status === "completed")
        .reduce((sum, t) => sum + (t.estimated_time || 0), 0);

      return {
        totalMinutes,
        completedMinutes,
        taskCount: allTasks.length,
        completedCount: allTasks.filter(t => t.status === "completed").length,
      };
    },
    enabled: !!user,
  });
}
