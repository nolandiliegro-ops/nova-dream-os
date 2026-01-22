import { GlassCard } from "./GlassCard";
import { Circle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const tasks = [
  {
    id: 1,
    title: "Lancer l'emmaillieur tasks",
    time: "9 jours, 42 minutes",
    completed: false,
    segment: "ecommerce" as const,
  },
  {
    id: 2,
    title: "Report-a conduncation freerback",
    time: "6 cutnws, 73 minutes",
    completed: false,
    segment: "consulting" as const,
  },
  {
    id: 3,
    title: "Add content to meeting",
    time: "Due today",
    completed: false,
    segment: "tiktok" as const,
  },
  {
    id: 4,
    title: "Review new project content",
    time: "Tomorrow",
    completed: false,
    segment: "oracle" as const,
  },
];

const segmentBorderColors = {
  ecommerce: "border-segment-ecommerce",
  tiktok: "border-segment-tiktok",
  consulting: "border-segment-consulting",
  oracle: "border-segment-oracle",
};

export function TasksWidget() {
  return (
    <GlassCard className="col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Urgent Tasks</h3>
        <button className="rounded-full p-1 hover:bg-secondary transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border-l-2 bg-secondary/30 p-3 transition-all hover:bg-secondary/50",
              segmentBorderColors[task.segment]
            )}
          >
            <button className="mt-0.5 rounded-full p-0.5 hover:bg-secondary transition-colors">
              <Circle className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground">{task.time}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
