import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RevenueWidget } from "@/components/dashboard/RevenueWidget";
import { ActiveProjectsWidget } from "@/components/dashboard/ActiveProjectsWidget";
import { DeadlineWidget } from "@/components/dashboard/DeadlineWidget";
import { TasksWidget } from "@/components/dashboard/TasksWidget";
import { ToolsWidget } from "@/components/dashboard/ToolsWidget";
import { Goal100kWidget } from "@/components/dashboard/Goal100kWidget";
import { MissionFocusWidget } from "@/components/dashboard/MissionFocusWidget";
import { StrategicCalendarWidget } from "@/components/dashboard/StrategicCalendarWidget";
import { HabitTrackerWidget } from "@/components/dashboard/HabitTrackerWidget";
import { DailyBriefingWidget } from "@/components/dashboard/DailyBriefingWidget";
import { DraggableWidgetWrapper } from "@/components/dashboard/DraggableWidgetWrapper";
import { useMode } from "@/contexts/ModeContext";
import { useRealtimeTransactions } from "@/hooks/useRealtimeTransactions";
import { useLoginNotifications } from "@/hooks/useLoginNotifications";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, RotateCcw, Check } from "lucide-react";

// Widget configuration registry
interface WidgetConfig {
  id: string;
  component: React.ComponentType;
  colSpan: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  rowSpan?: number;
  label: string;
  modeRestriction?: "work" | "personal"; // Only show in specific mode
}

const WIDGET_REGISTRY: Record<string, WidgetConfig> = {
  briefing: {
    id: "briefing",
    component: DailyBriefingWidget,
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    label: "Briefing du Jour",
  },
  revenue: {
    id: "revenue",
    component: RevenueWidget,
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    rowSpan: 2,
    label: "Revenus",
  },
  projects: {
    id: "projects",
    component: ActiveProjectsWidget,
    colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    label: "Projets",
  },
  deadlines: {
    id: "deadlines",
    component: DeadlineWidget,
    colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    label: "Deadlines",
  },
  goal: {
    id: "goal",
    component: Goal100kWidget,
    colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    label: "Objectif 100k",
  },
  tools: {
    id: "tools",
    component: ToolsWidget,
    colSpan: { mobile: 1, tablet: 1, desktop: 1 },
    label: "Outils",
  },
  calendar: {
    id: "calendar",
    component: StrategicCalendarWidget,
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    label: "Calendrier",
  },
  focus: {
    id: "focus",
    component: MissionFocusWidget,
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    label: "Focus Missions",
  },
  habits: {
    id: "habits",
    component: HabitTrackerWidget,
    colSpan: { mobile: 1, tablet: 2, desktop: 2 },
    label: "Habitudes",
    modeRestriction: "personal", // Only visible in personal mode
  },
  tasks: {
    id: "tasks",
    component: TasksWidget,
    colSpan: { mobile: 1, tablet: 2, desktop: 4 },
    label: "Tâches",
  },
};

// Helper to get Tailwind col-span classes (explicit for purging)
const getColSpanClass = (config: WidgetConfig): string => {
  const key = `${config.colSpan.mobile}-${config.colSpan.tablet}-${config.colSpan.desktop}`;
  
  const colSpanMap: Record<string, string> = {
    "1-1-1": "col-span-1",
    "1-1-2": "col-span-1 lg:col-span-2",
    "1-2-2": "col-span-1 md:col-span-2 lg:col-span-2",
    "1-2-4": "col-span-1 md:col-span-2 lg:col-span-4",
  };

  return colSpanMap[key] || "col-span-1";
};

// Helper to get Tailwind row-span classes
const getRowSpanClass = (config: WidgetConfig): string => {
  if (config.rowSpan === 2) return "md:row-span-2";
  return "";
};

export default function Dashboard() {
  const { mode } = useMode();
  const { widgetOrder, isEditMode, toggleEditMode, moveWidget, resetOrder } = useDashboardLayout(mode);

  // Enable realtime notifications for new transactions
  useRealtimeTransactions();

  // Show login notifications (deadlines, missing transactions, milestones)
  useLoginNotifications();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome message + Edit Mode Controls */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold md:text-3xl">
                Bonjour, <span className="text-gradient">Bienvenue</span> 👋
              </h1>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs font-semibold px-3 py-1 rounded-full border-2 animate-pulse",
                  mode === "work" 
                    ? "border-segment-tiktok text-segment-tiktok bg-segment-tiktok/10"
                    : "border-segment-data text-segment-data bg-segment-data/10"
                )}
              >
                {mode === "work" ? "BUSINESS" : "PERSO"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {mode === "work"
                ? "Voici l'aperçu de tes activités business"
                : "Voici l'aperçu de ta vie personnelle"}
            </p>
          </div>

          {/* Layout Controls */}
          <div className="flex items-center gap-2">
            {isEditMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetOrder}
                className="text-muted-foreground hover:text-foreground rounded-2xl"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Reset
              </Button>
            )}
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={toggleEditMode}
              className={cn(
                "rounded-2xl transition-all duration-300",
                isEditMode && "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              )}
            >
              {isEditMode ? (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Terminer
                </>
              ) : (
                <>
                  <LayoutGrid className="h-4 w-4 mr-1.5" />
                  Modifier Layout
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Bento Grid - Dynamic Rendering */}
        <div
          className={cn(
            "grid gap-4 transition-all duration-500",
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
            "auto-rows-auto",
            isEditMode && "gap-6 pt-4"
          )}
        >
          {widgetOrder.map((widgetId, index) => {
            const config = WIDGET_REGISTRY[widgetId];
            if (!config) return null;

            // Skip widget if mode restriction doesn't match
            if (config.modeRestriction && config.modeRestriction !== mode) {
              return null;
            }

            const Component = config.component;
            const colSpanClass = getColSpanClass(config);
            const rowSpanClass = getRowSpanClass(config);

            return (
              <DraggableWidgetWrapper
                key={widgetId}
                widgetId={widgetId}
                label={config.label}
                colSpanClass={colSpanClass}
                rowSpanClass={rowSpanClass}
                isEditMode={isEditMode}
                isFirst={index === 0}
                isLast={index === widgetOrder.length - 1}
                onMoveUp={() => moveWidget(widgetId, "up")}
                onMoveDown={() => moveWidget(widgetId, "down")}
              >
                <Component />
              </DraggableWidgetWrapper>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
