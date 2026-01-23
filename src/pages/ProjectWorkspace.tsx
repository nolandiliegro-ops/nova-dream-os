import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useProject } from "@/hooks/useProjects";
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
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectInfoWidget } from "@/components/project-workspace/ProjectInfoWidget";
import { ProjectTasksWidget } from "@/components/project-workspace/ProjectTasksWidget";
import { ProjectFinancesWidget } from "@/components/project-workspace/ProjectFinancesWidget";
import { ProjectDocumentsWidget } from "@/components/project-workspace/ProjectDocumentsWidget";
import { ProjectTimelineWidget } from "@/components/project-workspace/ProjectTimelineWidget";
import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";

const segmentLabels: Record<string, string> = {
  ecommerce: "E-commerce",
  tiktok: "TikTok",
  consulting: "Consulting",
  oracle: "Oracle",
  data: "Les Enquêtes",
  tech: "Dream App",
  other: "Autre",
};

const segmentColors: Record<string, string> = {
  ecommerce: "bg-segment-ecommerce text-white",
  tiktok: "bg-segment-tiktok text-white",
  consulting: "bg-segment-consulting text-white",
  oracle: "bg-segment-oracle text-white",
  data: "bg-segment-data text-white",
  tech: "bg-segment-tech text-white",
  other: "bg-muted text-muted-foreground",
};

interface WidgetVisibility {
  info: boolean;
  tasks: boolean;
  finances: boolean;
  documents: boolean;
  timeline: boolean;
}

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id);
  
  // Widget visibility state with localStorage persistence
  const [visibleWidgets, setVisibleWidgets] = useState<WidgetVisibility>(() => {
    const saved = localStorage.getItem(`project-widgets-${id}`);
    return saved ? JSON.parse(saved) : {
      info: true,
      tasks: true,
      finances: true,
      documents: true,
      timeline: true,
    };
  });

  // Focus mode state
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Persist visibility to localStorage
  useEffect(() => {
    if (id) {
      localStorage.setItem(`project-widgets-${id}`, JSON.stringify(visibleWidgets));
    }
  }, [visibleWidgets, id]);

  const toggleWidget = (widget: keyof WidgetVisibility) => {
    setVisibleWidgets(prev => ({
      ...prev,
      [widget]: !prev[widget]
    }));
  };

  const exitFocusMode = () => setIsFocusMode(false);

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

  const widgetButtons = [
    { key: "info" as const, icon: Info, label: "Info" },
    { key: "tasks" as const, icon: ListTodo, label: "Tâches" },
    { key: "finances" as const, icon: DollarSign, label: "Finances" },
    { key: "documents" as const, icon: FileText, label: "Documents" },
    { key: "timeline" as const, icon: Clock, label: "Timeline" },
  ];

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
      <span className={cn(
        "px-2 py-0.5 rounded-full text-xs font-medium",
        segmentColors[project?.segment || "other"]
      )}>
        {segmentLabels[project?.segment || "other"]}
      </span>
    </div>
  ) : undefined;

  return (
    <DashboardLayout hideSidebar={isFocusMode} headerContent={focusModeHeader}>
      <div className="space-y-6 animate-fade-in">
        {/* Header with Breadcrumb - hidden in focus mode */}
        {!isFocusMode && (
          <div className="flex flex-col gap-4">
            {/* Navigation */}
            <div className="flex items-center justify-between">
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
                <span className="text-muted-foreground">Projets</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium truncate">{project.name}</span>
              </div>

              {/* Focus Mode Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFocusMode(true)}
                className="gap-1.5"
              >
                <Focus className="h-4 w-4" />
                <span className="hidden sm:inline">Mode Focus</span>
              </Button>
            </div>

            {/* Title and Segment Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="text-2xl font-bold md:text-3xl">{project.name}</h1>
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-medium w-fit",
                segmentColors[project.segment]
              )}>
                {segmentLabels[project.segment]}
              </span>
            </div>
          </div>
        )}

        {/* Widget Toggle Bar - hidden in focus mode */}
        {!isFocusMode && (
          <div className="flex gap-2 flex-wrap p-3 glass-card">
            <span className="text-sm text-muted-foreground mr-2 self-center">Afficher :</span>
            {widgetButtons.map(({ key, icon: Icon, label }) => (
              <Button
                key={key}
                variant={visibleWidgets[key] ? "default" : "outline"}
                size="sm"
                onClick={() => toggleWidget(key)}
                className="gap-1.5"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
                {visibleWidgets[key] ? (
                  <Eye className="h-3 w-3 ml-1 opacity-60" />
                ) : (
                  <EyeOff className="h-3 w-3 ml-1 opacity-60" />
                )}
              </Button>
            ))}
          </div>
        )}

        {/* Pomodoro Timer - always visible, especially in focus mode */}
        {isFocusMode && (
          <div className="flex justify-center mb-4">
            <PomodoroTimer />
          </div>
        )}

        {/* Timeline Widget - Full width, hidden in focus mode */}
        {visibleWidgets.timeline && !isFocusMode && (
          <div className="w-full">
            <ProjectTimelineWidget projectId={project.id} />
          </div>
        )}

        {/* Bento Grid */}
        <div className={cn(
          "grid gap-4",
          isFocusMode ? "grid-cols-1" : "md:grid-cols-2"
        )}>
          {/* Info Widget - hidden in focus mode */}
          {visibleWidgets.info && !isFocusMode && (
            <div className="md:col-span-1">
              <ProjectInfoWidget project={project} />
            </div>
          )}

          {/* Tasks Widget - always visible in focus mode, expanded */}
          {visibleWidgets.tasks && (
            <div className={cn(
              isFocusMode ? "col-span-1" : "md:col-span-1"
            )}>
              <ProjectTasksWidget 
                projectId={project.id} 
                projectName={project.name}
                mode={project.mode as "work" | "personal"}
              />
            </div>
          )}

          {/* Finances Widget - hidden in focus mode */}
          {visibleWidgets.finances && !isFocusMode && (
            <div className="md:col-span-1">
              <ProjectFinancesWidget 
                projectId={project.id}
                segment={project.segment} 
                budget={project.budget}
              />
            </div>
          )}

          {/* Documents Widget - hidden in focus mode */}
          {visibleWidgets.documents && !isFocusMode && (
            <div className="md:col-span-1">
              <ProjectDocumentsWidget 
                segment={project.segment}
                mode={project.mode as "work" | "personal"}
              />
            </div>
          )}
        </div>

        {/* Empty state when all widgets are hidden - not in focus mode */}
        {!isFocusMode && !Object.values(visibleWidgets).some(v => v) && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <EyeOff className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Tous les widgets sont masqués. Utilisez les boutons ci-dessus pour les afficher.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
