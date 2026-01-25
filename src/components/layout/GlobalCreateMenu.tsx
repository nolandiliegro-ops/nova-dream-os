import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FolderKanban, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickTaskDialog } from "./QuickTaskDialog";
import { QuickProjectDialog } from "./QuickProjectDialog";
import { AddGlobalMissionDialog } from "@/components/dashboard/AddGlobalMissionDialog";

export function GlobalCreateMenu() {
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [missionDialogOpen, setMissionDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-xl border-dashed border-primary/50",
              "bg-primary/5 hover:bg-primary/10 hover:border-primary",
              "transition-all duration-200",
              "glow-primary-sm"
            )}
          >
            <Plus className="h-5 w-5 text-primary" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            onClick={() => setTaskDialogOpen(true)}
            className="cursor-pointer gap-2"
          >
            <Zap className="h-4 w-4 text-segment-oracle" />
            <span>Tâche Flash</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setMissionDialogOpen(true)}
            className="cursor-pointer gap-2"
          >
            <Target className="h-4 w-4 text-primary" />
            <span>Mission</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setProjectDialogOpen(true)}
            className="cursor-pointer gap-2"
          >
            <FolderKanban className="h-4 w-4 text-segment-ecommerce" />
            <span>Nouveau Projet</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Task Dialog */}
      <QuickTaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} />

      {/* Quick Project Dialog */}
      <QuickProjectDialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen} />

      {/* Mission Dialog - Reuse existing */}
      <AddGlobalMissionDialog open={missionDialogOpen} onOpenChange={setMissionDialogOpen} />
    </>
  );
}
