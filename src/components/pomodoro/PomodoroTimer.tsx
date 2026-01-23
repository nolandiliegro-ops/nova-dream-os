import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Coffee, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useMode } from "@/contexts/ModeContext";
import { toast } from "sonner";

const WORK_TIME = 25 * 60; // 25 minutes in seconds
const BREAK_TIME = 5 * 60; // 5 minutes in seconds

export function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  
  const { mode } = useMode();
  const { data: tasks } = useTasks(mode);
  const updateTask = useUpdateTask();

  const totalTime = isBreak ? BREAK_TIME : WORK_TIME;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer completed
      if (!isBreak) {
        // Work session completed - show log dialog
        setShowLogDialog(true);
        toast.success("🍅 Pomodoro terminé !");
      } else {
        // Break completed - switch to work
        toast.info("Pause terminée, on reprend !");
        setTimeLeft(WORK_TIME);
        setIsBreak(false);
      }
      setIsRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, isBreak]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(isBreak ? BREAK_TIME : WORK_TIME);
  }, [isBreak]);

  const startBreak = useCallback(() => {
    setIsBreak(true);
    setTimeLeft(BREAK_TIME);
    setIsRunning(true);
    setShowLogDialog(false);
    setSelectedTaskId("");
  }, []);

  const skipLogging = useCallback(() => {
    setShowLogDialog(false);
    setSelectedTaskId("");
    setTimeLeft(WORK_TIME);
  }, []);

  const logTimeToTask = useCallback(async () => {
    if (!selectedTaskId) {
      toast.error("Sélectionne une tâche");
      return;
    }

    const task = tasks?.find((t) => t.id === selectedTaskId);
    if (!task) return;

    try {
      await updateTask.mutateAsync({
        id: selectedTaskId,
        time_spent: task.time_spent + 25,
      });
      toast.success("25 min ajoutées à la tâche !");
      setShowLogDialog(false);
      setSelectedTaskId("");
      setTimeLeft(WORK_TIME);
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    }
  }, [selectedTaskId, tasks, updateTask]);

  const incompleteTasks = tasks?.filter((t) => t.status !== "completed") || [];

  return (
    <>
      <div className="flex flex-col items-center gap-2 rounded-xl bg-sidebar-accent/30 p-3">
        {/* Timer circle */}
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg className="absolute h-full w-full -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-sidebar-accent"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - progress / 100)}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-300",
                isBreak ? "text-green-500" : "text-primary"
              )}
            />
          </svg>
          <span className="text-sm font-bold text-sidebar-foreground">
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1 text-xs text-sidebar-foreground/60">
          {isBreak ? (
            <>
              <Coffee className="h-3 w-3" />
              <span>Pause</span>
            </>
          ) : (
            <span>Focus</span>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={toggleTimer}
          >
            {isRunning ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={resetTimer}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Log time dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>🍅 Pomodoro terminé !</DialogTitle>
            <DialogDescription>
              Ajouter 25 minutes au temps passé sur une tâche ?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une tâche..." />
              </SelectTrigger>
              <SelectContent>
                {incompleteTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={skipLogging} className="w-full sm:w-auto">
              Ignorer
            </Button>
            <Button variant="outline" onClick={startBreak} className="w-full sm:w-auto">
              <Coffee className="mr-2 h-4 w-4" />
              Pause 5 min
            </Button>
            <Button onClick={logTimeToTask} disabled={!selectedTaskId} className="w-full sm:w-auto">
              <Check className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
