import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseDurationToMinutes } from "@/hooks/useMissions";

interface MissionTimerState {
  missionId: string | null;
  missionTitle: string;
  estimatedDuration: string | null;
  startTime: number | null;
  elapsed: number; // seconds
  isRunning: boolean;
}

interface MissionTimerContextType {
  state: MissionTimerState;
  startTimer: (missionId: string, title: string, estimated: string | null) => void;
  stopTimer: () => Promise<void>;
  pauseTimer: () => void;
  resumeTimer: () => void;
}

const MissionTimerContext = createContext<MissionTimerContextType | undefined>(undefined);

export function MissionTimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MissionTimerState>({
    missionId: null,
    missionTitle: "",
    estimatedDuration: null,
    startTime: null,
    elapsed: 0,
    isRunning: false,
  });

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

  const startTimer = useCallback((missionId: string, title: string, estimated: string | null) => {
    // If another mission is running, notify user
    if (state.missionId && state.missionId !== missionId && state.isRunning) {
      toast.info("Timer précédent arrêté");
    }

    setState({
      missionId,
      missionTitle: title,
      estimatedDuration: estimated,
      startTime: Date.now(),
      elapsed: 0,
      isRunning: true,
    });

    toast.success(`⏱️ Timer démarré : ${title}`);
  }, [state.missionId, state.isRunning]);

  const stopTimer = useCallback(async () => {
    if (!state.missionId || state.elapsed === 0) {
      setState({
        missionId: null,
        missionTitle: "",
        estimatedDuration: null,
        startTime: null,
        elapsed: 0,
        isRunning: false,
      });
      return;
    }

    const minutesWorked = Math.ceil(state.elapsed / 60);

    try {
      // Fetch current time_spent and add to it
      const { data: currentMission } = await supabase
        .from("missions")
        .select("time_spent")
        .eq("id", state.missionId)
        .single();

      const currentTimeSpent = currentMission?.time_spent || 0;

      await supabase
        .from("missions")
        .update({ time_spent: currentTimeSpent + minutesWorked })
        .eq("id", state.missionId);

      // Compare with estimation
      const estimatedMinutes = parseDurationToMinutes(state.estimatedDuration);
      const totalTimeSpent = currentTimeSpent + minutesWorked;
      
      if (estimatedMinutes > 0) {
        const percentage = Math.round((totalTimeSpent / estimatedMinutes) * 100);
        toast.success(
          `+${minutesWorked} min sur "${state.missionTitle}" (${totalTimeSpent}/${estimatedMinutes} min = ${percentage}%)`
        );
      } else {
        toast.success(`+${minutesWorked} min ajoutées à "${state.missionTitle}"`);
      }
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement du temps");
    }

    setState({
      missionId: null,
      missionTitle: "",
      estimatedDuration: null,
      startTime: null,
      elapsed: 0,
      isRunning: false,
    });
  }, [state.missionId, state.elapsed, state.missionTitle, state.estimatedDuration]);

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
    <MissionTimerContext.Provider
      value={{ state, startTimer, stopTimer, pauseTimer, resumeTimer }}
    >
      {children}
    </MissionTimerContext.Provider>
  );
}

export function useMissionTimer() {
  const context = useContext(MissionTimerContext);
  if (!context) {
    throw new Error("useMissionTimer must be used within a MissionTimerProvider");
  }
  return context;
}
