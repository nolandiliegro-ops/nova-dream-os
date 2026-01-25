import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useUrgentDeadlines } from "@/hooks/useProjects";
import { useApiStatus } from "@/hooks/useApiConfigs";
import { useApiConfig } from "@/hooks/useApiConfigs";
import {
  LayoutDashboard,
  Wallet,
  FolderKanban,
  CheckSquare,
  Bot,
  FileText,
  Settings,
  LogOut,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";
import { GlobalCreateMenu } from "./GlobalCreateMenu";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Finances", url: "/finances", icon: Wallet },
  { title: "Projets", url: "/projects", icon: FolderKanban },
  { title: "Tâches & Missions", url: "/tasks", icon: CheckSquare },
  { title: "Assistant IA", url: "/assistant", icon: Bot },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Paramètres", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const { count: urgentCount, hasUrgent } = useUrgentDeadlines(48);
  const { data: apiStatus } = useApiStatus();
  const { data: webhookConfig } = useApiConfig("n8n_webhook");

  // Check if any API is not configured
  const hasUnconfiguredApi = !apiStatus?.resend || !webhookConfig;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary glow-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">Nova</span>
              <span className="text-xs text-sidebar-foreground/60">Life OS</span>
            </div>
          </div>
          <GlobalCreateMenu />
        </div>
        <PomodoroTimer />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                    >
                      <div className="relative">
                        <item.icon className="h-5 w-5" />
                        {/* Red badge for urgent deadlines on Projects */}
                        {item.url === "/projects" && hasUrgent && (
                          <span 
                            className={cn(
                              "absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-destructive animate-pulse",
                              urgentCount > 9 ? "h-4 w-4 text-[8px]" : "h-4 w-4 text-[10px]"
                            )}
                          >
                            <span className="font-bold text-destructive-foreground">
                              {urgentCount > 9 ? "9+" : urgentCount}
                            </span>
                          </span>
                        )}
                        {/* Warning badge for unconfigured APIs on Settings */}
                        {item.url === "/settings" && hasUnconfiguredApi && (
                          <span 
                            className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-amber-500 h-4 w-4"
                          >
                            <AlertTriangle className="h-2.5 w-2.5 text-white" />
                          </span>
                        )}
                      </div>
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-2">
          {user && (
            <p className="truncate text-xs text-sidebar-foreground/60">
              {user.email}
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
