import { useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { Heart, Check, Dumbbell, Brain, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHabits, useToggleHabitDay, useCreateDefaultHabits } from "@/hooks/useHabits";
import { format, subDays, isToday } from "date-fns";
import { fr } from "date-fns/locale";

// Map icon names to Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dumbbell: Dumbbell,
  brain: Brain,
  "book-open": BookOpen,
  check: Check,
};

// Get last 7 days including today
function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
  }
  return days;
}

// Format day for display (L, M, M, J, V, S, D)
function formatDayShort(dateStr: string): string {
  const date = new Date(dateStr);
  return format(date, "EEEEE", { locale: fr }).toUpperCase();
}

// Check if a date is completed for a habit
function isCompleted(completedDays: string[], date: string): boolean {
  return completedDays.includes(date);
}

export function HabitTrackerWidget() {
  const { data: habits, isLoading } = useHabits();
  const toggleDay = useToggleHabitDay();
  const createDefaults = useCreateDefaultHabits();

  const last7Days = getLast7Days();
  const today = format(new Date(), "yyyy-MM-dd");

  // Create default habits if none exist
  useEffect(() => {
    if (!isLoading && habits && habits.length === 0) {
      createDefaults.mutate();
    }
  }, [isLoading, habits, createDefaults]);

  const handleToggle = (habitId: string, date: string) => {
    toggleDay.mutate({ habitId, date });
  };

  return (
    <GlassCard className="border-segment-data/30 bg-segment-data/5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-segment-data/20">
          <Heart className="h-4 w-4 text-segment-data" />
        </div>
        <div>
          <h3 className="font-semibold">Suivi Habitudes</h3>
          <p className="text-xs text-muted-foreground">7 derniers jours</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-segment-data" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Days header */}
          <div className="grid grid-cols-8 gap-1 sm:gap-2">
            <div className="text-xs text-muted-foreground" /> {/* Empty cell for habit name */}
            {last7Days.map((day) => (
              <div
                key={day}
                className={cn(
                  "text-[10px] sm:text-xs text-center font-medium",
                  isToday(new Date(day)) && "text-segment-data"
                )}
              >
                {formatDayShort(day)}
              </div>
            ))}
          </div>

          {/* Habits rows */}
          {habits?.map((habit) => {
            const IconComponent = iconMap[habit.icon || "check"] || Check;

            return (
              <div
                key={habit.id}
                className="grid grid-cols-8 gap-1 sm:gap-2 items-center"
              >
                {/* Habit name with icon */}
                <div className="flex items-center gap-1 min-w-0">
                  <IconComponent className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="text-xs truncate">{habit.title}</span>
                </div>

                {/* Day toggles */}
                {last7Days.map((day) => {
                  const completed = isCompleted(habit.completed_days, day);
                  const isTodayDate = day === today;

                  return (
                    <button
                      key={day}
                      onClick={() => handleToggle(habit.id, day)}
                      disabled={toggleDay.isPending}
                      className={cn(
                        "w-5 h-5 sm:w-6 sm:h-6 mx-auto rounded-full border-2 transition-all duration-200 flex items-center justify-center",
                        "hover:scale-110 active:scale-95",
                        completed
                          ? "bg-segment-data border-segment-data shadow-lg shadow-segment-data/25"
                          : isTodayDate
                          ? "border-segment-data/50 hover:border-segment-data hover:bg-segment-data/10"
                          : "border-muted-foreground/30 hover:border-muted-foreground/50"
                      )}
                    >
                      {completed && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* Empty state */}
          {(!habits || habits.length === 0) && !createDefaults.isPending && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Chargement des habitudes...
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
