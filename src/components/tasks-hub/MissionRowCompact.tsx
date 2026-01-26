import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Star, CalendarIcon, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MissionWithContext } from "@/hooks/useAllMissions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MissionRowCompactProps {
  mission: MissionWithContext;
  isSelected: boolean;
  onSelect: () => void;
  onToggleComplete: () => void;
  onToggleFocus: () => void;
  onDateChange: (date: Date | undefined) => void;
  onDelete: () => void;
}

export function MissionRowCompact({
  mission,
  isSelected,
  onSelect,
  onToggleComplete,
  onToggleFocus,
  onDateChange,
  onDelete,
}: MissionRowCompactProps) {
  const isCompleted = mission.status === "completed";

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 rounded-lg p-2 transition-all cursor-pointer group",
        isCompleted && "opacity-60",
        isSelected 
          ? "bg-primary/20 ring-1 ring-primary" 
          : "bg-muted/30 hover:bg-muted/50",
        mission.is_focus && !isSelected && "ring-1 ring-segment-oracle/50"
      )}
    >
      <Checkbox 
        checked={isCompleted} 
        onCheckedChange={onToggleComplete}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      />

      <button
        onClick={(e) => { e.stopPropagation(); onToggleFocus(); }}
        className="shrink-0"
      >
        <Star
          className={cn(
            "h-3.5 w-3.5 transition-colors",
            mission.is_focus
              ? "fill-segment-oracle text-segment-oracle"
              : "text-muted-foreground hover:text-segment-oracle"
          )}
        />
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-sm truncate",
          isCompleted && "line-through"
        )}>
          {mission.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {mission.projectName || "Sans projet"}
        </p>
      </div>

      {/* Progress */}
      {mission.totalTasks > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <Progress value={mission.progress} className="h-1 w-8" />
          <span className="text-[10px] text-muted-foreground">
            {mission.completedTasks}/{mission.totalTasks}
          </span>
        </div>
      )}

      {/* Date picker (on hover) */}
      <Popover>
        <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <CalendarIcon className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end" onClick={(e) => e.stopPropagation()}>
          <Calendar
            mode="single"
            selected={mission.deadline ? new Date(mission.deadline) : undefined}
            onSelect={onDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Actions menu (on hover) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={onToggleFocus}>
            <Star className="h-4 w-4 mr-2" />
            {mission.is_focus ? "Retirer du focus" : "Ajouter au focus"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
