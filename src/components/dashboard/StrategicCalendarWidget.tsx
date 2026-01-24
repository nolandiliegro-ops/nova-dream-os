import { useState, useMemo } from "react";
import { GlassCard } from "./GlassCard";
import { Calendar } from "@/components/ui/calendar";
import { useMode } from "@/contexts/ModeContext";
import { useMissionsWithDeadlines } from "@/hooks/useMissions";
import { CalendarDays, ChevronRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, isSameDay, differenceInHours, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const segmentLabels: Record<string, string> = {
  // Work
  ecommerce: "E-commerce",
  tiktok: "TikTok",
  consulting: "Consulting",
  oracle: "Oracle",
  data: "Les Enquêtes",
  tech: "Dream App",
  // Personal
  hobby: "Hobbies",
  wellness: "Bien-être",
  travel: "Voyages",
  other: "Autre",
};

const segmentColors: Record<string, string> = {
  // Work
  ecommerce: "bg-segment-ecommerce/20 text-segment-ecommerce border-segment-ecommerce/30",
  tiktok: "bg-segment-tiktok/20 text-segment-tiktok border-segment-tiktok/30",
  consulting: "bg-segment-consulting/20 text-segment-consulting border-segment-consulting/30",
  oracle: "bg-segment-oracle/20 text-segment-oracle border-segment-oracle/30",
  data: "bg-segment-data/20 text-segment-data border-segment-data/30",
  tech: "bg-segment-tech/20 text-segment-tech border-segment-tech/30",
  // Personal
  hobby: "bg-segment-oracle/20 text-segment-oracle border-segment-oracle/30",
  wellness: "bg-segment-data/20 text-segment-data border-segment-data/30",
  travel: "bg-segment-consulting/20 text-segment-consulting border-segment-consulting/30",
  other: "bg-muted/20 text-muted-foreground border-muted/30",
};

// Check if deadline is urgent (< 48h)
const isDeadlineUrgent = (deadline: string): boolean => {
  const deadlineDate = new Date(deadline);
  const hoursUntilDeadline = differenceInHours(deadlineDate, new Date());
  return hoursUntilDeadline >= 0 && hoursUntilDeadline <= 48;
};

const isDeadlinePast = (deadline: string): boolean => {
  return isPast(new Date(deadline));
};

export function StrategicCalendarWidget() {
  const { mode } = useMode();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const { data: missions, isLoading } = useMissionsWithDeadlines(mode);

  // Get dates that have mission deadlines with urgency info
  const deadlineInfo = useMemo(() => {
    if (!missions) return new Map<string, { hasDeadline: boolean; isUrgent: boolean; isPast: boolean }>();
    const info = new Map<string, { hasDeadline: boolean; isUrgent: boolean; isPast: boolean }>();
    missions
      .filter(m => m.deadline)
      .forEach(m => {
        const dateStr = m.deadline!;
        info.set(dateStr, {
          hasDeadline: true,
          isUrgent: isDeadlineUrgent(dateStr),
          isPast: isDeadlinePast(dateStr),
        });
      });
    return info;
  }, [missions]);

  // Get dates that have mission deadlines
  const datesWithDeadlines = useMemo(() => {
    if (!missions) return new Set<string>();
    return new Set(
      missions
        .filter(m => m.deadline)
        .map(m => m.deadline!)
    );
  }, [missions]);

  // Get missions for selected date
  const missionsForSelectedDate = useMemo(() => {
    if (!missions || !selectedDate) return [];
    return missions.filter(m => {
      if (!m.deadline) return false;
      return isSameDay(new Date(m.deadline), selectedDate);
    });
  }, [missions, selectedDate]);

  const handleMissionClick = (projectId: string) => {
    navigate(`/projects/${projectId}?tab=roadmap`);
  };

  // Custom day content to show deadline indicators
  const modifiers = useMemo(() => {
    const hasDeadline: Date[] = [];
    datesWithDeadlines.forEach((dateStr: string) => {
      hasDeadline.push(new Date(dateStr));
    });
    return { hasDeadline };
  }, [datesWithDeadlines]);

  const modifiersStyles = {
    hasDeadline: {
      position: 'relative' as const,
    }
  };

  return (
    <GlassCard className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Calendrier Stratégique</h3>
        </div>
        <span className="text-xs text-muted-foreground font-trading">
          {format(currentMonth, "MMMM yyyy", { locale: fr })}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={fr}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-2xl border border-border/50 bg-background/30 p-2"
              classNames={{
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day: cn(
                  "h-8 w-8 p-0 font-trading text-sm",
                  "aria-selected:opacity-100"
                ),
                head_cell: "text-muted-foreground font-trading text-xs w-8",
                cell: "relative",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              }}
              components={{
                DayContent: ({ date }) => {
                  const dateStr = format(date, "yyyy-MM-dd");
                  const hasDeadline = datesWithDeadlines.has(dateStr);
                  const info = deadlineInfo.get(dateStr);
                  const isUrgent = info?.isUrgent || false;
                  const isPastDate = info?.isPast || false;
                  
                  return (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <span>{date.getDate()}</span>
                      {hasDeadline && (
                        <span 
                          className={cn(
                            "absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full",
                            isPastDate 
                              ? "bg-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.8)] animate-pulse"
                              : isUrgent
                                ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse"
                                : "bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.8)]"
                          )} 
                        />
                      )}
                    </div>
                  );
                }
              }}
            />
          </div>

          {/* Missions for selected date */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-trading">
              {selectedDate 
                ? `Missions du ${format(selectedDate, "d MMMM", { locale: fr })}`
                : "Sélectionne une date"
              }
            </p>
            
            {missionsForSelectedDate.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {missionsForSelectedDate.map((mission) => (
                  <div
                    key={mission.id}
                    onClick={() => handleMissionClick(mission.project_id)}
                    className={cn(
                      "p-2 rounded-xl border border-border/50 cursor-pointer",
                      "bg-background/30 hover:bg-background/50",
                      "transition-all duration-200 hover:scale-[1.02]",
                      "flex items-center justify-between group"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full border shrink-0",
                        segmentColors[mission.projectSegment] || segmentColors.other
                      )}>
                        {segmentLabels[mission.projectSegment] || "Autre"}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {mission.title}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/70 text-center py-2">
                Aucune mission prévue
              </p>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
