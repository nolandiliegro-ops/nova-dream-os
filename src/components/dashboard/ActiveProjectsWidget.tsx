import { GlassCard } from "./GlassCard";
import { ShoppingCart, Video, Briefcase, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const projects = [
  {
    id: 1,
    name: "E-Commerce",
    icon: ShoppingCart,
    segment: "ecommerce" as const,
    subtitle: "pieces-trottinettes.fr",
  },
  {
    id: 2,
    name: "TikTok Shop",
    icon: Video,
    segment: "tiktok" as const,
    subtitle: "Creator Program",
  },
  {
    id: 3,
    name: "Consulting",
    icon: Briefcase,
    segment: "consulting" as const,
    subtitle: "Enquêtes & Missions",
  },
  {
    id: 4,
    name: "Oracle",
    icon: Sparkles,
    segment: "oracle" as const,
    subtitle: "Projets Spéciaux",
  },
];

const segmentColors = {
  ecommerce: "bg-segment-ecommerce text-white",
  tiktok: "bg-segment-tiktok text-white",
  consulting: "bg-segment-consulting text-white",
  oracle: "bg-segment-oracle text-white",
};

const segmentBgColors = {
  ecommerce: "bg-segment-ecommerce/10",
  tiktok: "bg-segment-tiktok/10",
  consulting: "bg-segment-consulting/10",
  oracle: "bg-segment-oracle/10",
};

export function ActiveProjectsWidget() {
  return (
    <GlassCard className="col-span-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Active Projects</h3>
        <button className="rounded-full p-1 hover:bg-secondary transition-colors">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {projects.map((project) => (
          <button
            key={project.id}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl p-3 transition-all hover:scale-105",
              segmentBgColors[project.segment]
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                segmentColors[project.segment]
              )}
            >
              <project.icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-center">{project.name}</span>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}
