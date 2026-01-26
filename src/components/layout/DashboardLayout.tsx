import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ModeSwitch } from "./ModeSwitch";
import { ThemeToggle } from "./ThemeToggle";
import { MultiNotesPanel } from "./MultiNotesPanel";
import { Bell, AlertTriangle, DollarSign, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useUrgentDeadlines } from "@/hooks/useProjects";
import { useTransactions } from "@/hooks/useTransactions";
import { useMode } from "@/contexts/ModeContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface DashboardLayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
  headerContent?: React.ReactNode;
}

// Notification item component
function NotificationItem({
  icon,
  type,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  type: "deadline" | "sale" | "milestone";
  title: string;
  description: string;
  onClick?: () => void;
}) {
  const typeStyles = {
    deadline: "bg-destructive/10 border-destructive/30 text-destructive",
    sale: "bg-segment-ecommerce/10 border-segment-ecommerce/30 text-segment-ecommerce",
    milestone: "bg-primary/10 border-primary/30 text-primary",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-xl border transition-all",
        "hover:scale-[1.02] hover:shadow-md",
        typeStyles[type]
      )}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 text-left">
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

export function DashboardLayout({ children, hideSidebar = false, headerContent }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { mode } = useMode();
  const { urgentProjects } = useUrgentDeadlines(48, mode);
  const { data: transactions } = useTransactions(mode);

  // Get sales from last 24 hours
  const recentSales = transactions
    ?.filter((t) => {
      const transactionDate = new Date(t.date);
      const now = new Date();
      const hoursAgo = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);
      return t.type === "income" && hoursAgo <= 24;
    })
    .slice(0, 5) || [];

  // Calculate total revenue for milestone checks
  const totalRevenue = transactions
    ?.filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  // Check milestones
  const milestones = [
    { threshold: 100000, label: "100k€ atteint! 🎉" },
    { threshold: 75000, label: "75k€ atteint! 🔥" },
    { threshold: 50000, label: "50k€ atteint! 💪" },
    { threshold: 25000, label: "25k€ atteint! 🚀" },
  ];
  const reachedMilestone = milestones.find((m) => totalRevenue >= m.threshold);

  const notificationCount = urgentProjects.length + recentSales.length;

  return (
    <SidebarProvider>
      <div className={cn(
        "flex min-h-screen w-full relative overflow-hidden transition-all duration-700",
        mode === "personal" && "mode-personal"
      )}>
        {/* Deep Space Ambient Glows - Colors change based on mode */}
        <div className="ambient-glow ambient-glow-1" />
        <div className="ambient-glow ambient-glow-2" />
        <div className="ambient-glow ambient-glow-3" />
        
        {!hideSidebar && <AppSidebar />}
        
        <div className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          hideSidebar && "w-full"
        )}>
          {/* Header */}
          <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <div className="flex items-center gap-4">
              {!hideSidebar && <SidebarTrigger className="text-foreground" />}
              {headerContent}
            </div>

            {/* Center: Mode Switch - hidden in focus mode */}
            {!hideSidebar && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <ModeSwitch />
              </div>
            )}

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {!hideSidebar && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {notificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white animate-pulse">
                          {notificationCount > 9 ? "9+" : notificationCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[380px] sm:w-[420px] glass-card border-l">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2 text-lg">
                        <Bell className="h-5 w-5 text-primary" />
                        Centre de notifications
                      </SheetTitle>
                    </SheetHeader>

                    {/* Multi-Notes Panel */}
                    <div className="mt-4">
                      <MultiNotesPanel />
                    </div>

                    <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                      {/* Milestone */}
                      {reachedMilestone && (
                        <NotificationItem
                          icon={<Trophy className="h-5 w-5" />}
                          type="milestone"
                          title={reachedMilestone.label}
                          description={`Tu as généré ${totalRevenue.toLocaleString("fr-FR")}€ de revenus !`}
                          onClick={() => navigate("/finances")}
                        />
                      )}

                      {/* Urgent Deadlines */}
                      {urgentProjects.map((project) => (
                        <NotificationItem
                          key={project.id}
                          icon={<AlertTriangle className="h-5 w-5" />}
                          type="deadline"
                          title={project.name}
                          description={`Deadline ${formatDistanceToNow(new Date(project.deadline!), {
                            addSuffix: true,
                            locale: fr,
                          })}`}
                          onClick={() => navigate(`/projects/${project.id}`)}
                        />
                      ))}

                      {/* Recent Sales */}
                      {recentSales.map((sale) => (
                        <NotificationItem
                          key={sale.id}
                          icon={<DollarSign className="h-5 w-5" />}
                          type="sale"
                          title={`+${Number(sale.amount).toLocaleString("fr-FR")}€`}
                          description={sale.description || sale.segment || "Nouvelle vente"}
                          onClick={() => navigate("/finances")}
                        />
                      ))}

                      {/* Empty State */}
                      {notificationCount === 0 && !reachedMilestone && (
                        <div className="text-center py-16">
                          <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <Bell className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                          <p className="text-muted-foreground font-medium">Aucune notification</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            Tout est sous contrôle 👌
                          </p>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              <ThemeToggle />
            </div>
          </header>

          {/* Main Content */}
          <main className={cn(
            "flex-1 overflow-auto p-4 md:p-6",
            hideSidebar && "max-w-6xl mx-auto w-full"
          )}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
