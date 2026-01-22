import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const segmentColors: Record<string, string> = {
  ecommerce: "border-segment-ecommerce text-segment-ecommerce",
  tiktok: "border-segment-tiktok text-segment-tiktok",
  consulting: "border-segment-consulting text-segment-consulting",
  oracle: "border-segment-oracle text-segment-oracle",
};

const segmentBgColors: Record<string, string> = {
  ecommerce: "bg-segment-ecommerce/20",
  tiktok: "bg-segment-tiktok/20",
  consulting: "bg-segment-consulting/20",
  oracle: "bg-segment-oracle/20",
};

// Placeholder projects
const projects = [
  { id: 1, name: "Boutique Shopify V2", segment: "ecommerce", status: "in_progress", progress: 65, deadline: "2026-02-15" },
  { id: 2, name: "Campagne TikTok Q1", segment: "tiktok", status: "in_progress", progress: 40, deadline: "2026-01-31" },
  { id: 3, name: "Audit Client Alpha", segment: "consulting", status: "completed", progress: 100, deadline: "2026-01-20" },
  { id: 4, name: "Formation Oracle Cloud", segment: "oracle", status: "planned", progress: 0, deadline: "2026-03-01" },
];

const statusConfig = {
  planned: { label: "Planifié", icon: Clock, color: "text-muted-foreground" },
  in_progress: { label: "En cours", icon: AlertCircle, color: "text-primary" },
  completed: { label: "Terminé", icon: CheckCircle2, color: "text-segment-ecommerce" },
};

export default function Projects() {
  const { mode } = useMode();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Projets <span className="text-gradient">2026</span>
            </h1>
            <p className="text-muted-foreground">
              {mode === "work" ? "Gestion de tes projets business" : "Tes projets personnels"}
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-xs text-muted-foreground">Projets totaux</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-segment-ecommerce/20">
                <CheckCircle2 className="h-5 w-5 text-segment-ecommerce" />
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">Terminés</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">Planifiés</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const StatusIcon = statusConfig[project.status as keyof typeof statusConfig].icon;
            
            return (
              <GlassCard 
                key={project.id} 
                className={cn(
                  "p-5 border-l-4 cursor-pointer transition-all hover:scale-[1.02]",
                  segmentColors[project.segment]
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("rounded-lg p-2", segmentBgColors[project.segment])}>
                    <FolderKanban className={cn("h-5 w-5", segmentColors[project.segment].split(" ")[1])} />
                  </div>
                  <div className={cn("flex items-center gap-1 text-xs", statusConfig[project.status as keyof typeof statusConfig].color)}>
                    <StatusIcon className="h-3 w-3" />
                    <span>{statusConfig[project.status as keyof typeof statusConfig].label}</span>
                  </div>
                </div>
                
                <h3 className="font-semibold mb-1">{project.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Deadline: {new Date(project.deadline).toLocaleDateString('fr-FR')}
                </p>
                
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div 
                      className={cn(
                        "h-full transition-all",
                        project.progress === 100 ? "bg-segment-ecommerce" : "bg-primary"
                      )}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </GlassCard>
            );
          })}
          
          {/* Add new project card */}
          <GlassCard className="p-5 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
            <div className="text-center">
              <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Ajouter un projet</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
