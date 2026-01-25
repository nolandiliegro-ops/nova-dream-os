import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModeProvider } from "@/contexts/ModeContext";
import { TaskTimerProvider } from "@/contexts/TaskTimerContext";
import { MissionTimerProvider } from "@/contexts/MissionTimerContext";
import { FloatingTaskTimer } from "@/components/timer/FloatingTaskTimer";
import { FloatingMissionTimer } from "@/components/timer/FloatingMissionTimer";
import Index from "./pages/Index";
import Finances from "./pages/Finances";
import Projects from "./pages/Projects";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import Tasks from "./pages/Tasks";
import Assistant from "./pages/Assistant";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <ModeProvider>
          <MissionTimerProvider>
            <TaskTimerProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/finances" element={<Finances />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:id" element={<ProjectWorkspace />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/assistant" element={<Assistant />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
                <FloatingTaskTimer />
                <FloatingMissionTimer />
              </TooltipProvider>
            </TaskTimerProvider>
          </MissionTimerProvider>
        </ModeProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
