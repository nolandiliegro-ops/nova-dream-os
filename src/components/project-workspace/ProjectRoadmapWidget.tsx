import { useState } from "react";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { Map, Plus, Loader2 } from "lucide-react";
import { useMissionsWithProgress } from "@/hooks/useMissions";
import { MissionCard } from "./MissionCard";
import { AddMissionDialog } from "./AddMissionDialog";

interface ProjectRoadmapWidgetProps {
  projectId: string;
  mode: "work" | "personal";
}

export function ProjectRoadmapWidget({ projectId, mode }: ProjectRoadmapWidgetProps) {
  const { data: missions, isLoading } = useMissionsWithProgress(projectId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <GlassCard className="p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          <h3 className="font-trading text-lg">Roadmap</h3>
          <span className="text-xs text-muted-foreground">
            ({missions?.length || 0} missions)
          </span>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          size="sm"
          className="gap-1.5 rounded-2xl"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto min-h-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : missions && missions.length > 0 ? (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-border" />
            
            {/* Missions */}
            <div className="space-y-4">
              {missions.map((mission, index) => (
                <MissionCard 
                  key={mission.id} 
                  mission={mission}
                  isFirst={index === 0}
                  isLast={index === missions.length - 1}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Map className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground mb-2">Aucune mission définie</p>
            <p className="text-xs text-muted-foreground mb-4">
              Les missions structurent ta roadmap projet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddDialogOpen(true)}
              className="rounded-2xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer ta première mission
            </Button>
          </div>
        )}
      </div>

      <AddMissionDialog
        projectId={projectId}
        mode={mode}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </GlassCard>
  );
}
