import { useMemo, useState } from "react";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Target, Clock, AlertTriangle, CheckCircle2, Calendar, 
  Play, ArrowRight, Wrench, Palette, Code, Container, Zap, 
  Globe, FileText, Video, MessageSquare, Mail, Phone, Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MissionWithContext } from "@/hooks/useAllMissions";
import { Task, useTasksByMission, useUpdateTask, useToggleTaskComplete } from "@/hooks/useTasks";
import { useCompleteMission } from "@/hooks/useMissions";
import { useTaskTimer } from "@/contexts/TaskTimerContext";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";

// Tool icons mapping
const toolIcons: Record<string, React.ElementType> = {
  "Figma": Palette,
  "figma": Palette,
  "VS Code": Code,
  "vscode": Code,
  "Docker": Container,
  "docker": Container,
  "Vercel": Zap,
  "vercel": Zap,
  "Chrome": Globe,
  "chrome": Globe,
  "Browser": Globe,
  "browser": Globe,
  "Notion": FileText,
  "notion": FileText,
  "Terminal": Terminal,
  "terminal": Terminal,
  "Video": Video,
  "video": Video,
  "Loom": Video,
  "loom": Video,
  "Slack": MessageSquare,
  "slack": MessageSquare,
  "Discord": MessageSquare,
  "discord": MessageSquare,
  "Email": Mail,
  "email": Mail,
  "Gmail": Mail,
  "gmail": Mail,
  "Phone": Phone,
  "phone": Phone,
  "Meet": Video,
  "meet": Video,
  "Zoom": Video,
  "zoom": Video,
};

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0min";
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `${remaining}min`;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h${remaining.toString().padStart(2, '0')}`;
}

interface MissionIntelPanelProps {
  mission: MissionWithContext | null;
  onTaskClick?: (task: Task) => void;
}

export function MissionIntelPanel({ mission, onTaskClick }: MissionIntelPanelProps) {
  const { data: tasks } = useTasksByMission(mission?.id);
  const updateTask = useUpdateTask();
  const toggleTaskComplete = useToggleTaskComplete();
  const completeMission = useCompleteMission();
  const { startTimer } = useTaskTimer();
  const [isPostponing, setIsPostponing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Calculate time health
  const timeHealth = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { totalEstimated: 0, totalSpent: mission?.time_spent || 0, variance: 0, status: "neutral" as const };
    }
    
    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimated_time || 0), 0);
    const totalSpent = mission?.time_spent || 0;
    const variance = totalEstimated - totalSpent;
    
    let status: "ahead" | "on_track" | "behind" | "critical" | "neutral";
    if (totalEstimated === 0) status = "neutral";
    else if (variance > 60) status = "ahead";
    else if (variance >= 0) status = "on_track";
    else if (variance > -120) status = "behind";
    else status = "critical";
    
    return { totalEstimated, totalSpent, variance, status };
  }, [tasks, mission?.time_spent]);

  // Get recommended focus task
  const focusTask = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;
    
    const pendingTasks = tasks.filter(t => t.status !== "completed");
    if (pendingTasks.length === 0) return null;
    
    const priorityWeight = { high: 0, medium: 1, low: 2 };
    
    return pendingTasks.sort((a, b) => {
      // 1. Priority (high first)
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[a.priority] - priorityWeight[b.priority];
      }
      // 2. Due date (closest first)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      // 3. Shortest estimated time (quick wins)
      return a.estimated_time - b.estimated_time;
    })[0];
  }, [tasks]);

  // Consolidate all tools
  const allTools = useMemo(() => {
    if (!tasks) return [];
    const toolsSet = new Set<string>();
    tasks.forEach(task => {
      (task.required_tools || []).forEach(tool => toolsSet.add(tool));
    });
    return Array.from(toolsSet).sort();
  }, [tasks]);

  // Task stats
  const taskStats = useMemo(() => {
    if (!tasks) return { total: 0, completed: 0, pending: 0 };
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === "completed").length,
      pending: tasks.filter(t => t.status !== "completed").length,
    };
  }, [tasks]);

  // Mass action: Postpone all
  const handlePostponeAll = async () => {
    if (!tasks) return;
    setIsPostponing(true);
    
    try {
      const tasksToPostpone = tasks.filter(t => t.status !== "completed" && t.due_date);
      await Promise.all(
        tasksToPostpone.map(task =>
          updateTask.mutateAsync({
            id: task.id,
            due_date: format(addDays(new Date(task.due_date!), 1), "yyyy-MM-dd"),
          })
        )
      );
      toast.success(`${tasksToPostpone.length} tâches reportées à demain`);
    } catch {
      toast.error("Erreur lors du report");
    } finally {
      setIsPostponing(false);
    }
  };

  // Mass action: Close mission
  const handleCloseMission = async () => {
    if (!mission) return;
    setIsClosing(true);
    
    try {
      await completeMission.mutateAsync({ missionId: mission.id, complete: true });
      toast.success("Mission clôturée - toutes les tâches terminées");
    } catch {
      toast.error("Erreur lors de la clôture");
    } finally {
      setIsClosing(false);
    }
  };

  // Empty state
  if (!mission) {
    return (
      <GlassCard className="h-full flex flex-col items-center justify-center p-8 text-center">
        <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold text-lg mb-2">Sélectionne une mission</h3>
        <p className="text-muted-foreground text-sm">
          Clique sur une mission dans la liste pour voir son analyse détaillée
        </p>
        <ArrowRight className="h-8 w-8 text-muted-foreground/30 mt-4 rotate-180" />
      </GlassCard>
    );
  }

  const getToolIcon = (tool: string) => {
    return toolIcons[tool] || Wrench;
  };

  const statusConfig = {
    ahead: { color: "text-segment-ecommerce", bg: "bg-segment-ecommerce/20", label: "En avance", icon: CheckCircle2 },
    on_track: { color: "text-primary", bg: "bg-primary/20", label: "Dans les temps", icon: Clock },
    behind: { color: "text-segment-oracle", bg: "bg-segment-oracle/20", label: "Léger retard", icon: AlertTriangle },
    critical: { color: "text-destructive", bg: "bg-destructive/20", label: "Retard critique", icon: AlertTriangle },
    neutral: { color: "text-muted-foreground", bg: "bg-muted", label: "Non défini", icon: Clock },
  };

  const healthConfig = statusConfig[timeHealth.status];
  const HealthIcon = healthConfig.icon;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-1">
        {/* Header */}
        <GlassCard className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{mission.title}</h2>
              <p className="text-sm text-muted-foreground">
                {mission.projectName || "Sans projet"}
                {mission.deadline && (
                  <span className="ml-2">
                    • Deadline: {format(new Date(mission.deadline), "d MMM yyyy", { locale: fr })}
                  </span>
                )}
              </p>
            </div>
            <Badge 
              variant="secondary" 
              className={cn(
                mission.status === "completed" ? "bg-segment-ecommerce/20 text-segment-ecommerce" :
                mission.status === "in_progress" ? "bg-primary/20 text-primary" : ""
              )}
            >
              {mission.status === "completed" ? "Terminée" : 
               mission.status === "in_progress" ? "En cours" : "En attente"}
            </Badge>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{Math.round(mission.progress)}%</span>
            </div>
            <Progress value={mission.progress} className="h-2" />
          </div>
        </GlassCard>

        {/* Time Health Widget */}
        <GlassCard className="p-4">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" />
            Santé Temporelle
          </h3>
          
          <div className="space-y-3">
            {/* Visual gauge */}
            <div className="relative">
              <Progress 
                value={timeHealth.totalEstimated > 0 
                  ? Math.min(100, (timeHealth.totalSpent / timeHealth.totalEstimated) * 100) 
                  : 0
                } 
                className={cn("h-3", healthConfig.bg)}
              />
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">{formatMinutes(timeHealth.totalEstimated)}</p>
                <p className="text-xs text-muted-foreground">Estimé</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">{formatMinutes(timeHealth.totalSpent)}</p>
                <p className="text-xs text-muted-foreground">Passé</p>
              </div>
              <div className={cn("p-2 rounded-lg", healthConfig.bg)}>
                <p className={cn("text-lg font-bold", healthConfig.color)}>
                  {timeHealth.variance >= 0 ? "+" : ""}{formatMinutes(Math.abs(timeHealth.variance))}
                </p>
                <p className="text-xs text-muted-foreground">Delta</p>
              </div>
            </div>
            
            {/* Status badge */}
            <div className={cn("flex items-center gap-2 p-2 rounded-lg", healthConfig.bg)}>
              <HealthIcon className={cn("h-4 w-4", healthConfig.color)} />
              <span className={cn("text-sm font-medium", healthConfig.color)}>{healthConfig.label}</span>
            </div>
          </div>
        </GlassCard>

        {/* Focus Task Card */}
        {focusTask && (
          <GlassCard className="p-4 border border-primary/30">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              Focus Recommandé
            </h3>
            
            <div 
              className="p-3 rounded-lg bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => onTaskClick?.(focusTask)}
            >
              <p className="font-medium">{focusTask.title}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                {focusTask.estimated_time > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatMinutes(focusTask.estimated_time)}
                  </span>
                )}
                {focusTask.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(focusTask.due_date), "d MMM", { locale: fr })}
                  </span>
                )}
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs",
                    focusTask.priority === "high" ? "bg-destructive/20 text-destructive" :
                    focusTask.priority === "medium" ? "bg-segment-oracle/20 text-segment-oracle" :
                    "bg-segment-consulting/20 text-segment-consulting"
                  )}
                >
                  {focusTask.priority === "high" ? "Haute" : focusTask.priority === "medium" ? "Moyenne" : "Basse"}
                </Badge>
              </div>
              {focusTask.required_tools && focusTask.required_tools.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {focusTask.required_tools.slice(0, 4).map((tool, idx) => {
                    const Icon = getToolIcon(tool);
                    return (
                      <div key={idx} className="p-1 rounded bg-muted">
                        <Icon className="h-3 w-3 text-muted-foreground" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <Button 
              className="w-full mt-3 gap-2" 
              size="sm"
              onClick={() => startTimer(focusTask.id, focusTask.title)}
            >
              <Play className="h-4 w-4" />
              Démarrer
            </Button>
          </GlassCard>
        )}

        {/* Tools Gallery */}
        {allTools.length > 0 && (
          <GlassCard className="p-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4" />
              Outils Requis ({allTools.length})
            </h3>
            
            <TooltipProvider>
              <div className="flex flex-wrap gap-2">
                {allTools.map((tool, idx) => {
                  const Icon = getToolIcon(tool);
                  return (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <div className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors cursor-default">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{tool}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          </GlassCard>
        )}

        {/* Task List */}
        <GlassCard className="p-4">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4" />
            Tâches ({taskStats.completed}/{taskStats.total})
          </h3>
          
          {tasks && tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer hover:bg-muted/50",
                    task.status === "completed" ? "bg-segment-ecommerce/10 opacity-60" : "bg-muted/30"
                  )}
                  onClick={() => onTaskClick?.(task)}
                >
                  <Checkbox
                    checked={task.status === "completed"}
                    onCheckedChange={() => toggleTaskComplete.mutate({ id: task.id, completed: task.status !== "completed" })}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={cn(
                    "flex-1 text-sm truncate",
                    task.status === "completed" && "line-through"
                  )}>
                    {task.title}
                  </span>
                  {task.estimated_time > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {formatMinutes(task.estimated_time)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune tâche pour cette mission
            </p>
          )}
        </GlassCard>

        {/* Mass Actions */}
        <GlassCard className="p-4">
          <h3 className="font-semibold text-sm mb-3">Actions Rapides</h3>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-2"
              onClick={handlePostponeAll}
              disabled={isPostponing || taskStats.pending === 0}
            >
              <Calendar className="h-4 w-4" />
              Tout reporter
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1 gap-2"
              onClick={handleCloseMission}
              disabled={isClosing || mission.status === "completed"}
            >
              <CheckCircle2 className="h-4 w-4" />
              Clôturer
            </Button>
          </div>
        </GlassCard>
      </div>
    </ScrollArea>
  );
}
