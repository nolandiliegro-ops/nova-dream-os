import { useMemo, useState } from "react";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTasksByProject } from "@/hooks/useTasks";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths, isWithinInterval, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectTimelineWidgetProps {
  projectId: string;
}

interface TimelineEvent {
  id: string;
  title: string;
  date: Date;
  type: "completed" | "upcoming" | "in_progress";
}

export function ProjectTimelineWidget({ projectId }: ProjectTimelineWidgetProps) {
  const { data: tasks, isLoading } = useTasksByProject(projectId);
  const [viewOffset, setViewOffset] = useState(0); // 0 = current month centered
  
  // Generate timeline events from tasks
  const events = useMemo(() => {
    if (!tasks) return [];
    
    return tasks
      .filter(task => task.due_date || task.completed_at)
      .map(task => {
        // Determine type based on status
        let type: "completed" | "upcoming" | "in_progress" = "upcoming";
        if (task.status === "completed" || task.completed_at) {
          type = "completed";
        } else if (task.status === "in_progress") {
          type = "in_progress";
        }
        
        return {
          id: task.id,
          title: task.title,
          date: new Date(task.completed_at || task.due_date!),
          type
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [tasks]);

  // Calculate visible months (6 months window)
  const visibleMonths = useMemo(() => {
    const centerDate = addMonths(new Date(), viewOffset);
    const start = subMonths(centerDate, 2);
    const end = addMonths(centerDate, 3);
    return eachMonthOfInterval({ start, end });
  }, [viewOffset]);

  // Group events by month
  const eventsByMonth = useMemo(() => {
    const grouped: Record<string, TimelineEvent[]> = {};
    
    visibleMonths.forEach(month => {
      const key = format(month, "yyyy-MM");
      grouped[key] = events.filter(event => 
        isWithinInterval(event.date, {
          start: startOfMonth(month),
          end: endOfMonth(month)
        })
      );
    });
    
    return grouped;
  }, [events, visibleMonths]);

  const navigateTimeline = (direction: "prev" | "next") => {
    setViewOffset(prev => direction === "prev" ? prev - 1 : prev + 1);
  };

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "completed":
        return <CheckCircle2 className="h-3 w-3 text-segment-ecommerce" />;
      case "in_progress":
        return <Circle className="h-3 w-3 text-segment-oracle fill-segment-oracle/50" />;
      case "upcoming":
        return <Circle className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getEventColor = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "completed":
        return "bg-segment-ecommerce";
      case "in_progress":
        return "bg-segment-oracle";
      case "upcoming":
        return "bg-muted-foreground";
    }
  };

  return (
    <GlassCard className="p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Timeline</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => navigateTimeline("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setViewOffset(0)}
            className="text-xs"
          >
            Aujourd'hui
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => navigateTimeline("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="relative">
          {/* Timeline legend */}
          <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-segment-ecommerce" />
              <span>Terminée</span>
            </div>
            <div className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-segment-oracle fill-segment-oracle/50" />
              <span>En cours</span>
            </div>
            <div className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-muted-foreground" />
              <span>À venir</span>
            </div>
          </div>

          {/* Timeline container */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Month labels */}
              <div className="flex border-b border-border pb-2 mb-2">
                {visibleMonths.map((month) => (
                  <div 
                    key={format(month, "yyyy-MM")}
                    className={cn(
                      "flex-1 text-center text-sm font-medium min-w-[100px]",
                      isSameMonth(month, new Date()) && "text-primary"
                    )}
                  >
                    {format(month, "MMM yyyy", { locale: fr })}
                  </div>
                ))}
              </div>

              {/* Timeline line and events */}
              <div className="relative h-20">
                {/* Base line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
                
                {/* Today marker */}
                {visibleMonths.some(m => isSameMonth(m, new Date())) && (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                    style={{
                      left: `${((visibleMonths.findIndex(m => isSameMonth(m, new Date())) + 0.5) / visibleMonths.length) * 100}%`
                    }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] text-primary font-medium">
                      Aujourd'hui
                    </div>
                  </div>
                )}

                {/* Events by month */}
                <div className="flex h-full">
                  {visibleMonths.map((month) => {
                    const monthKey = format(month, "yyyy-MM");
                    const monthEvents = eventsByMonth[monthKey] || [];
                    
                    return (
                      <div 
                        key={monthKey}
                        className="flex-1 relative min-w-[100px]"
                      >
                        {monthEvents.slice(0, 3).map((event, index) => (
                          <TooltipProvider key={event.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div 
                                  className={cn(
                                    "absolute left-1/2 -translate-x-1/2 flex items-center justify-center",
                                    "w-6 h-6 rounded-full bg-background border-2 cursor-pointer",
                                    "hover:scale-110 transition-transform",
                                    event.type === "completed" && "border-segment-ecommerce",
                                    event.type === "in_progress" && "border-segment-oracle",
                                    event.type === "upcoming" && "border-muted-foreground"
                                  )}
                                  style={{
                                    top: index === 0 ? "50%" : index === 1 ? "25%" : "75%",
                                    transform: `translate(-50%, -50%) translateX(${(index - 1) * 10}px)`
                                  }}
                                >
                                  {getEventIcon(event.type)}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <p className="font-medium">{event.title}</p>
                                  <p className="text-muted-foreground">
                                    {format(event.date, "d MMM yyyy", { locale: fr })}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                        
                        {/* More indicator */}
                        {monthEvents.length > 3 && (
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
                            +{monthEvents.length - 3}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Empty state */}
          {events.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune tâche avec date planifiée</p>
              <p className="text-xs">Ajoutez des dates limites à vos tâches</p>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
