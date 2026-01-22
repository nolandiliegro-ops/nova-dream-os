import { GlassCard } from "./GlassCard";
import { Mail, BarChart3, Bot, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const tools = [
  {
    id: 1,
    name: "Email",
    icon: Mail,
    color: "bg-blue-500",
  },
  {
    id: 2,
    name: "Analytics",
    icon: BarChart3,
    color: "bg-orange-500",
  },
  {
    id: 3,
    name: "AI Assistant",
    icon: Bot,
    color: "bg-purple-500",
  },
];

export function ToolsWidget() {
  return (
    <GlassCard className="col-span-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Tools</h3>
        <button className="rounded-full p-1 hover:bg-secondary transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className="flex w-full items-center gap-3 rounded-xl p-2 transition-all hover:bg-secondary/50"
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                tool.color
              )}
            >
              <tool.icon className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium">{tool.name}</span>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}
