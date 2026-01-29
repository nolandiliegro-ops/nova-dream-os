import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useProject } from "@/hooks/useProjects";
import { useProjectWorkspaceLayout, DEFAULT_PROJECT_WIDGET_ORDER } from "@/hooks/useProjectWorkspaceLayout";
import { DraggableWidgetWrapper } from "@/components/dashboard/DraggableWidgetWrapper";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ChevronRight, 
  Info, 
  ListTodo, 
  DollarSign, 
  FileText,
  Loader2,
  Eye,
  EyeOff,
  Focus,
  X,
  Clock,
  Map,
  GripVertical,
  RotateCcw,
  Settings,
  Wallet,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectInfoWidget } from "@/components/project-workspace/ProjectInfoWidget";
import { ProjectTasksWidget } from "@/components/project-workspace/ProjectTasksWidget";
import { ProjectFinancesWidget } from "@/components/project-workspace/ProjectFinancesWidget";
import { ProjectDocumentsWidget } from "@/components/project-workspace/ProjectDocumentsWidget";
import { ProjectTimelineWidget } from "@/components/project-workspace/ProjectTimelineWidget";
import { ProjectRoadmapWidget } from "@/components/project-workspace/ProjectRoadmapWidget";
import { ProjectBudgetWidget } from "@/components/project-workspace/ProjectBudgetWidget";
import { ProjectVelocityWidget } from "@/components/project-workspace/ProjectVelocityWidget";
import { ProjectSettingsDialog } from "@/components/project-workspace/ProjectSettingsDialog";
import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Project } from "@/hooks/useProjects";
import { useSegments, getSegmentLabel, getSegmentColor } from "@/hooks/useSegments";

// Widget configuration registry
interface ProjectWidgetConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colSpan: 1 | 2;
  hiddenInFocus: boolean;
}

const PROJECT_WIDGET_REGISTRY: Record<string, ProjectWidgetConfig> = {
  timeline: {
    id: "timeline",
    label: "Timeline",
    icon: Clock,
    colSpan: 2,
    hiddenInFocus: true,
  },
  info: {
    id: "info",
    label: "Info",
    icon: Info,
    colSpan: 1,
    hiddenInFocus: true,
  },
  roadmap: {
    id: "roadmap",
    label: "Roadmap",
    icon: Map,
    colSpan: 1,
    hiddenInFocus: true,
  },
  tasks: {
    id: "tasks",
    label: "Tâches",
    icon: ListTodo,
    colSpan: 1,
    hiddenInFocus: false,
  },
  budget: {
    id: "budget",
    label: "Budget",
    icon: Wallet,
    colSpan: 1,
    hiddenInFocus: true,
  },
  velocity: {
    id: "velocity",
    label: "Vélocité",
    icon: Zap,
    colSpan: 1,
    hiddenInFocus: true,
  },
  finances: {
    id: "finances",
    label: "Finances",
    icon: DollarSign,
    colSpan: 1,
    hiddenInFocus: true,
  },
  documents: {
    id: "documents",
    label: "Documents",
    icon: FileText,
    colSpan: 1,
    hiddenInFocus: true,
  },
};

// Widget visibility state type
type WidgetVisibility = Record<string, boolean>;

// Get col-span class based on config
const getColSpanClass = (config: ProjectWidgetConfig): string => {
  return config.colSpan === 2 ? "md:col-span-2" : "md:col-span-1";
};

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: project, isLoading } = useProject(id);
  const { data: segments } = useSegments(project?.mode as "work" | "personal" | undefined);
  
  // Layout management hook
  const { 
    widgetOrder, 
    isEditMode, 
    setIsEditMode, 
    moveWidget, 
    resetOrder 
  } = useProjectWorkspaceLayout(id || "");
  
  // Check for deep-link tab parameter
  const tabParam = searchParams.get("tab");
  
  // Settings dialog state
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Hourly rate state (persisted in localStorage)
  const [hourlyRate, setHourlyRate] = useState(() => {
    const saved = localStorage.getItem(`project-hourly-rate-${id}`);
    return saved ? parseFloat(saved) : 50;
  });
  
  // Widget visibility state with localStorage persistence
  const [visibleWidgets, setVisibleWidgets] = useState<WidgetVisibility>(() => {
    const saved = localStorage.getItem(`project-widgets-visibility-${id}`);
    const defaultVisibility: WidgetVisibility = {};
    // Include new widgets in default visibility
    [...DEFAULT_PROJECT_WIDGET_ORDER, "budget", "velocity"].forEach(widgetId => {
      defaultVisibility[widgetId] = true;
    });
    
    // If tab=roadmap, ensure roadmap is visible
    if (tabParam === "roadmap") {
      const parsed = saved ? JSON.parse(saved) : defaultVisibility;
      return { ...parsed, roadmap: true };
    }
    
    return saved ? JSON.parse(saved) : defaultVisibility;
  });

  // Focus mode state
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Persist visibility to localStorage
  useEffect(() => {
    if (id) {
      localStorage.setItem(`project-widgets-visibility-${id}`, JSON.stringify(visibleWidgets));
    }
  }, [visibleWidgets, id]);
  
  // Scroll to roadmap widget when deep-linked
  useEffect(() => {
    if (tabParam === "roadmap") {
      const roadmapElement = document.getElementById("widget-roadmap");
      if (roadmapElement) {
        roadmapElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [tabParam, project]);

  // Keyboard shortcuts for Focus Mode
  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => !prev);
  }, []);

  const exitFocusMode = useCallback(() => {
    setIsFocusMode(false);
  }, []);

  useKeyboardShortcuts([
    {
      key: "f",
      metaKey: true,
      shiftKey: true,
      callback: toggleFocusMode,
    },
    {
      key: "Escape",
      callback: exitFocusMode,
      enabled: isFocusMode,
    },
  ]);

  const toggleWidget = (widgetId: string) => {
    setVisibleWidgets((prev) => ({
      ...prev,
      [widgetId]: !prev[widgetId],
    }));
  };

  // Get the widget component for a given ID
  const getWidgetComponent = (widgetId: string, proj: Project) => {
    switch (widgetId) {
      case "timeline":
        return <ProjectTimelineWidget projectId={proj.id} />;
      case "info":
        return <ProjectInfoWidget project={proj} />;
      case "roadmap":
        return (
          <ProjectRoadmapWidget 
            projectId={proj.id} 
            mode={proj.mode as "work" | "personal"} 
          />
        );
      case "tasks":
        return (
          <ProjectTasksWidget 
            projectId={proj.id}
            projectName={proj.name}
            mode={proj.mode as "work" | "personal"}
          />
        );
      case "budget":
        return (
          <ProjectBudgetWidget
            projectId={proj.id}
            budget={proj.budget}
            segment={proj.segment}
            hourlyRate={hourlyRate}
          />
        );
      case "velocity":
        return (
          <ProjectVelocityWidget
            projectId={proj.id}
            segment={proj.segment}
          />
        );
      case "finances":
        return (
          <ProjectFinancesWidget
            projectId={proj.id}
            segment={proj.segment}
            budget={proj.budget}
          />
        );
      case "documents":
        return (
          <ProjectDocumentsWidget
            segment={proj.segment}
            mode={proj.mode as "work" | "personal"}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <p className="text-muted-foreground">Projet introuvable</p>
          <Button onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux projets
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Dynamic segment-based styling
  const segmentColor = getSegmentColor(segments, project.segment);
  const segmentStyle = { backgroundColor: segmentColor, color: "#fff" };
  const segmentBorderStyle = { borderColor: segmentColor };

  // Focus mode header content
  const focusModeHeader = isFocusMode ? (
    <div className="flex items-center gap-3">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={exitFocusMode}
        className="gap-1.5"
      >
        <X className="h-4 w-4" />
        Quitter Focus
      </Button>
      <span className="font-medium">{project?.name}</span>
      <span 
        className="px-2 py-0.5 rounded-full text-xs font-medium"
        style={segmentStyle}
      >
        {getSegmentLabel(segments, project?.segment || "other")}
      </span>
    </div>
  ) : undefined;

  // Filter visible widgets for rendering - include new widgets
  const allWidgetIds = [...new Set([...widgetOrder, "budget", "velocity"])];
  const getVisibleWidgets = () => {
    return allWidgetIds.filter(widgetId => {
      const config = PROJECT_WIDGET_REGISTRY[widgetId];
      if (!config) return false;
      if (!visibleWidgets[widgetId]) return false;
      if (isFocusMode && config.hiddenInFocus) return false;
      return true;
    });
  };

  const visibleWidgetList = getVisibleWidgets();
  const hasVisibleWidgets = visibleWidgetList.length > 0;

  return (
    <DashboardLayout hideSidebar={isFocusMode} headerContent={focusModeHeader}>
      <div className="space-y-6 animate-fade-in">
        {/* Sticky Header - hidden in focus mode */}
        {!isFocusMode && (
          <div 
            className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-4 -mx-3 px-3 pt-3 -mt-3 sm:-mx-4 sm:px-4 sm:pt-4 sm:-mt-4 border-b transition-colors duration-300 border-opacity-30"
            style={segmentBorderStyle}
          >
            {/* Navigation Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/projects")}
                  className="gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Retour</span>
                </Button>
                <span className="text-muted-foreground hidden sm:inline">Projets</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:inline" />
                <span className="font-medium truncate max-w-[200px]">{project.name}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Reset Layout */}
                {isEditMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetOrder}
                    className="gap-1.5"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                )}
                
                {/* Edit Layout Toggle */}
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="gap-1.5 rounded-2xl"
                >
                  <GripVertical className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {isEditMode ? "Terminer" : "Modifier Layout"}
                  </span>
                </Button>
                
                {/* Settings Button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSettingsOpen(true)}
                  className="gap-1.5 rounded-2xl"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Paramètres</span>
                </Button>
                
                {/* Focus Mode */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsFocusMode(true)}
                  className="gap-1.5 rounded-2xl"
                >
                  <Focus className="h-4 w-4" />
                  <span className="hidden sm:inline">Mode Focus</span>
                  <span className="hidden md:inline text-xs opacity-50 ml-1">⌘⇧F</span>
                </Button>
              </div>
            </div>

            {/* Title + Segment Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <h1 className="text-2xl font-bold md:text-3xl">{project.name}</h1>
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium w-fit"
                style={segmentStyle}
              >
                {getSegmentLabel(segments, project.segment)}
              </span>
            </div>

            {/* Widget Toggle Bar */}
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground mr-2 self-center">Afficher :</span>
              {Object.entries(PROJECT_WIDGET_REGISTRY).map(([key, config]) => {
                const Icon = config.icon;
                const isVisible = visibleWidgets[key];
                
                return (
                  <Button
                    key={key}
                    variant={isVisible ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleWidget(key)}
                    className="gap-1.5 rounded-2xl"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{config.label}</span>
                    {isVisible ? (
                      <Eye className="h-3 w-3 ml-1 opacity-60" />
                    ) : (
                      <EyeOff className="h-3 w-3 ml-1 opacity-60" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Pomodoro Timer - always visible in focus mode */}
        {isFocusMode && (
          <div className="flex justify-center mb-4">
            <PomodoroTimer />
          </div>
        )}

        {/* Dynamic Widget Grid */}
        {hasVisibleWidgets ? (
          <div className={cn(
            "grid gap-4",
            isFocusMode ? "grid-cols-1" : "md:grid-cols-2"
          )}>
            {visibleWidgetList.map((widgetId, index) => {
              const config = PROJECT_WIDGET_REGISTRY[widgetId];
              if (!config) return null;

              return (
                <DraggableWidgetWrapper
                  key={widgetId}
                  widgetId={widgetId}
                  label={config.label}
                  colSpanClass={isFocusMode ? "col-span-1" : getColSpanClass(config)}
                  isEditMode={isEditMode}
                  isFirst={index === 0}
                  isLast={index === visibleWidgetList.length - 1}
                  onMoveUp={() => moveWidget(widgetId, "up")}
                  onMoveDown={() => moveWidget(widgetId, "down")}
                >
                  <div id={`widget-${widgetId}`} className="h-full">
                    {getWidgetComponent(widgetId, project)}
                  </div>
                </DraggableWidgetWrapper>
              );
            })}
          </div>
        ) : (
          // Empty state when all widgets are hidden
          !isFocusMode && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <EyeOff className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Tous les widgets sont masqués. Utilisez les boutons ci-dessus pour les afficher.
              </p>
            </div>
          )
        )}
      </div>
      
      {/* Settings Dialog */}
      <ProjectSettingsDialog
        project={project}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        hourlyRate={hourlyRate}
        onHourlyRateChange={setHourlyRate}
      />
    </DashboardLayout>
  );
}
