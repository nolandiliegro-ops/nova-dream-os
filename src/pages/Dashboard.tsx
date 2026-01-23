import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RevenueWidget } from "@/components/dashboard/RevenueWidget";
import { ActiveProjectsWidget } from "@/components/dashboard/ActiveProjectsWidget";
import { DeadlineWidget } from "@/components/dashboard/DeadlineWidget";
import { TasksWidget } from "@/components/dashboard/TasksWidget";
import { ToolsWidget } from "@/components/dashboard/ToolsWidget";
import { Goal100kWidget } from "@/components/dashboard/Goal100kWidget";
import { useMode } from "@/contexts/ModeContext";
import { useRealtimeTransactions } from "@/hooks/useRealtimeTransactions";
import { useLoginNotifications } from "@/hooks/useLoginNotifications";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { mode } = useMode();
  
  // Enable realtime notifications for new transactions
  useRealtimeTransactions();
  
  // Show login notifications (deadlines, missing transactions, milestones)
  useLoginNotifications();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome message */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold md:text-3xl">
            Bonjour, <span className="text-gradient">Bienvenue</span> 👋
          </h1>
          <p className="text-muted-foreground">
            {mode === "work"
              ? "Voici l'aperçu de tes activités business"
              : "Voici l'aperçu de ta vie personnelle"}
          </p>
        </div>

        {/* Bento Grid */}
        <div
          className={cn(
            "grid gap-4 transition-all duration-500",
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
            "auto-rows-auto"
          )}
        >
          {/* Revenue Chart - Takes 2 columns and 2 rows */}
          <div className="md:col-span-2 md:row-span-2">
            <RevenueWidget />
          </div>

          {/* Active Projects */}
          <div className="md:col-span-1">
            <ActiveProjectsWidget />
          </div>

          {/* Deadline Countdown */}
          <div className="md:col-span-1">
            <DeadlineWidget />
          </div>

          {/* Goal 100k Widget */}
          <div className="md:col-span-1">
            <Goal100kWidget />
          </div>

          {/* Tools Widget */}
          <div className="md:col-span-1">
            <ToolsWidget />
          </div>

          {/* Tasks Widget - Takes 2 columns */}
          <div className="md:col-span-2 lg:col-span-3">
            <TasksWidget />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
