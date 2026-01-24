import { ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DraggableWidgetWrapperProps {
  widgetId: string;
  label: string;
  colSpanClass: string;
  rowSpanClass?: string;
  isEditMode: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  children: React.ReactNode;
}

export function DraggableWidgetWrapper({
  label,
  colSpanClass,
  rowSpanClass,
  isEditMode,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  children,
}: DraggableWidgetWrapperProps) {
  return (
    <div
      className={cn(
        colSpanClass,
        rowSpanClass,
        "relative transition-all duration-300 ease-out",
        isEditMode && "ring-2 ring-dashed ring-primary/40 rounded-2xl p-0.5"
      )}
    >
      {/* Edit Mode Controls */}
      {isEditMode && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 border border-border/50 shadow-lg">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-full hover:bg-primary/20 disabled:opacity-30"
            disabled={isFirst}
            onClick={onMoveUp}
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          
          <div className="flex items-center gap-1 px-1">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
            <Badge 
              variant="secondary" 
              className="text-[10px] font-trading px-2 py-0 h-5 bg-primary/10 text-primary border-0"
            >
              {label}
            </Badge>
          </div>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-full hover:bg-primary/20 disabled:opacity-30"
            disabled={isLast}
            onClick={onMoveDown}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      
      {/* Widget Content */}
      <div className={cn(
        "h-full transition-transform duration-200",
        isEditMode && "hover:scale-[1.01]"
      )}>
        {children}
      </div>
    </div>
  );
}
