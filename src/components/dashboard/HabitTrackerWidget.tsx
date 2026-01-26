import { useEffect, useState } from "react";
import { GlassCard } from "./GlassCard";
import { Heart, Check, Dumbbell, Brain, BookOpen, Loader2, Flame, Coffee, Moon, Sun, Zap, Music, Smile, Target, Filter, Star, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHabits, useToggleHabitDay, useCreateDefaultHabits, Habit } from "@/hooks/useHabits";
import { format, subDays, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Map icon names to Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  dumbbell: Dumbbell,
  brain: Brain,
  "book-open": BookOpen,
  check: Check,
  flame: Flame,
  coffee: Coffee,
  moon: Moon,
  sun: Sun,
  zap: Zap,
  music: Music,
  smile: Smile,
  target: Target,
  shield: Shield,
};

type FilterType = "all" | "daily" | "weekdays" | "weekly" | "active";

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

// Calculate streak for a habit
function calculateStreak(completedDays: string[]): number {
  const sortedDays = [...completedDays].sort().reverse();
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  
  let streak = 0;
  let currentDate = sortedDays.includes(today) ? today : yesterday;
  
  if (!sortedDays.includes(currentDate)) return 0;
  
  for (let i = 0; i < 365; i++) {
    const checkDate = format(subDays(new Date(currentDate), i), "yyyy-MM-dd");
    if (sortedDays.includes(checkDate)) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

export function HabitTrackerWidget() {
  const { data: habits, isLoading } = useHabits();
  const toggleDay = useToggleHabitDay();
  const createDefaults = useCreateDefaultHabits();
  const [filter, setFilter] = useState<FilterType>("all");

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

  // Filter habits based on selection
  const filteredHabits = habits?.filter((habit) => {
    if (filter === "all") return true;
    if (filter === "active") {
      // Show habits with activity in the last 7 days
      return last7Days.some(day => habit.completed_days.includes(day));
    }
    return habit.frequency === filter;
  }) || [];

  const filterLabels: Record<FilterType, string> = {
    all: "Toutes",
    daily: "Quotidien",
    weekdays: "Jours ouvrés",
    weekly: "Hebdo",
    active: "Actives",
  };

  return (
    <GlassCard className="border-segment-data/30 bg-segment-data/5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-segment-data/20">
            <Heart className="h-4 w-4 text-segment-data" />
          </div>
          <div>
            <h3 className="font-semibold">Suivi Habitudes</h3>
            <p className="text-xs text-muted-foreground">7 derniers jours</p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
              <Filter className="h-3.5 w-3.5" />
              {filterLabels[filter]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilter("all")}>
              <Check className={cn("h-4 w-4 mr-2", filter !== "all" && "opacity-0")} />
              Toutes les habitudes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("active")}>
              <Check className={cn("h-4 w-4 mr-2", filter !== "active" && "opacity-0")} />
              <Star className="h-4 w-4 mr-2 text-yellow-500" />
              Actives cette semaine
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilter("daily")}>
              <Check className={cn("h-4 w-4 mr-2", filter !== "daily" && "opacity-0")} />
              Quotidiennes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("weekdays")}>
              <Check className={cn("h-4 w-4 mr-2", filter !== "weekdays" && "opacity-0")} />
              Jours ouvrés
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("weekly")}>
              <Check className={cn("h-4 w-4 mr-2", filter !== "weekly" && "opacity-0")} />
              Hebdomadaires
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 flex-1">
          <Loader2 className="h-6 w-6 animate-spin text-segment-data" />
        </div>
      ) : (
        <div className="flex-1 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted">
          <div className="space-y-3">
            {/* Days header */}
            <div className="grid grid-cols-8 gap-1 sm:gap-2 sticky top-0 bg-inherit py-1">
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
            {filteredHabits.map((habit) => {
              const IconComponent = iconMap[habit.icon || "check"] || Check;
              const streak = calculateStreak(habit.completed_days);
              const colorClass = habit.color || "segment-data";

              return (
                <div
                  key={habit.id}
                  className="grid grid-cols-8 gap-1 sm:gap-2 items-center group"
                >
                  {/* Habit name with icon */}
                  <div className="flex items-center gap-1 min-w-0">
                    <IconComponent className={cn("h-3 w-3 shrink-0", `text-${colorClass}`)} />
                    <span className="text-xs truncate">{habit.title}</span>
                    {streak >= 3 && (
                      <span className="text-[9px] bg-segment-oracle/20 text-segment-oracle px-1 rounded hidden sm:inline">
                        🔥{streak}
                      </span>
                    )}
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
                            ? `bg-${colorClass} border-${colorClass} shadow-lg shadow-${colorClass}/25`
                            : isTodayDate
                            ? `border-${colorClass}/50 hover:border-${colorClass} hover:bg-${colorClass}/10`
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
            {filteredHabits.length === 0 && !createDefaults.isPending && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                {filter === "all" 
                  ? "Aucune habitude configurée"
                  : `Aucune habitude ${filterLabels[filter].toLowerCase()}`
                }
              </div>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
