import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { ModeSwitch } from "./ModeSwitch";
import { ThemeToggle } from "./ThemeToggle";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-foreground" />
            </div>

            {/* Center: Mode Switch */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <ModeSwitch />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
              </Button>
              <ThemeToggle />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
