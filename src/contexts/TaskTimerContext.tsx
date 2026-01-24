import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useUpdateTask } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskTimerState {
  taskId: string | null;
  taskTitle: string;
  startTime: number | null;
  elapsed: number; // seconds
  isRunning: boolean;
}

interface TaskTimerContextType {
  state: TaskTimerState;
  startTimer: (taskId: string, taskTitle: string) => void;
  stopTimer: () => Promise<void>;
  pauseTimer: () => void;
  resumeTimer: () => void;
}

const TaskTimerContext = createContext<TaskTimerContextType | undefined>(undefined);

export function TaskTimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TaskTimerState>({
    taskId: null,
    taskTitle: "",
    startTime: null,
    elapsed: 0,
    isRunning: false,
  });

  const updateTask = useUpdateTask();

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (state.isRunning && state.startTime) {
      interval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          elapsed: Math.floor((Date.now() - prev.startTime!) / 1000),
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRunning, state.startTime]);

  const startTimer = useCallback((taskId: string, taskTitle: string) => {
    // If another task is running, stop it first
    if (state.taskId && state.taskId !== taskId && state.isRunning) {
      toast.info("Timer précédent arrêté");
    }

    setState({
      taskId,
      taskTitle,
      startTime: Date.now(),
      elapsed: 0,
      isRunning: true,
    });

    toast.success(`Timer démarré : ${taskTitle}`);
  }, [state.taskId, state.isRunning]);

  const stopTimer = useCallback(async () => {
    if (!state.taskId || state.elapsed === 0) {
      setState({
        taskId: null,
        taskTitle: "",
        startTime: null,
        elapsed: 0,
        isRunning: false,
      });
      return;
    }

    const minutesWorked = Math.ceil(state.elapsed / 60);

    try {
      // Fetch current time_spent and add to it
      const { data: currentTask } = await supabase
        .from("tasks")
        .select("time_spent")
        .eq("id", state.taskId)
        .single();

      const currentTimeSpent = currentTask?.time_spent || 0;

      await updateTask.mutateAsync({
        id: state.taskId,
        time_spent: currentTimeSpent + minutesWorked,
      });

      toast.success(`+${minutesWorked} min ajoutées à "${state.taskTitle}"`);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement du temps");
    }

    setState({
      taskId: null,
      taskTitle: "",
      startTime: null,
      elapsed: 0,
      isRunning: false,
    });
  }, [state.taskId, state.elapsed, state.taskTitle, updateTask]);

  const pauseTimer = useCallback(() => {
    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const resumeTimer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunning: true,
      startTime: Date.now() - prev.elapsed * 1000,
    }));
  }, []);

  return (
    <TaskTimerContext.Provider
      value={{ state, startTimer, stopTimer, pauseTimer, resumeTimer }}
    >
      {children}
    </TaskTimerContext.Provider>
  );
}

export function useTaskTimer() {
  const context = useContext(TaskTimerContext);
  if (!context) {
    throw new Error("useTaskTimer must be used within a TaskTimerProvider");
  }
  return context;
}
