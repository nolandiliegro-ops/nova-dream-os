import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMode } from "@/contexts/ModeContext";
import { useTransactions } from "@/hooks/useTransactions";
import { useUrgentDeadlines } from "@/hooks/useProjects";
import { useTaskStats } from "@/hooks/useTasks";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function useLoginNotifications() {
  const { user } = useAuth();
  const { mode } = useMode();
  const navigate = useNavigate();
  
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(mode);
  const { urgentProjects, count: urgentCount } = useUrgentDeadlines(48);
  const taskStats = useTaskStats(mode);
  
  const [hasShownNotifications, setHasShownNotifications] = useState(false);
  
  useEffect(() => {
    // Don't show if: no user, already shown, or still loading data
    if (!user || hasShownNotifications || transactionsLoading) return;
    
    // Wait a bit for data to load
    const timer = setTimeout(() => {
      const alerts: Array<{
        type: string;
        title: string;
        description?: string;
        severity: "info" | "warning" | "error" | "success";
        action?: { label: string; path: string };
      }> = [];
      
      // 1. Deadlines urgentes (< 48h)
      if (urgentCount > 0) {
        const projectNames = urgentProjects
          .slice(0, 3)
          .map(p => p.name)
          .join(", ");
        
        alerts.push({
          type: "deadline",
          title: `⚠️ ${urgentCount} deadline${urgentCount > 1 ? 's' : ''} dans moins de 48h`,
          description: projectNames + (urgentCount > 3 ? ` +${urgentCount - 3} autres` : ""),
          severity: "error",
          action: { label: "Voir les projets", path: "/projects" }
        });
      }
      
      // 2. Tâches en retard
      if (taskStats?.overdue && taskStats.overdue > 0) {
        alerts.push({
          type: "overdue",
          title: `📋 ${taskStats.overdue} tâche${taskStats.overdue > 1 ? 's' : ''} en retard`,
          description: "Des tâches ont dépassé leur date d'échéance",
          severity: "warning",
          action: { label: "Voir les tâches", path: "/tasks" }
        });
      }
      
      // 3. Pas de transactions ce mois-ci
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const currentMonthTransactions = transactions?.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      
      if (!currentMonthTransactions || currentMonthTransactions.length === 0) {
        alerts.push({
          type: "no-transactions",
          title: "📊 Nono, n'oublie pas de lier tes ventes !",
          description: "Aucune transaction ce mois-ci. Synchronise tes ventes pour suivre ton objectif 100k.",
          severity: "warning",
          action: { label: "Ajouter une transaction", path: "/finances" }
        });
      }
      
      // 4. Milestones atteints (25k, 50k, 75k, 100k)
      const totalRevenue = transactions
        ?.filter(t => t.type === "income" && t.counts_toward_goal)
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const milestones = [25000, 50000, 75000, 100000];
      const sessionKey = `milestone_session_${new Date().toDateString()}`;
      const shownMilestones = JSON.parse(sessionStorage.getItem(sessionKey) || "[]");
      
      for (const milestone of milestones) {
        if (totalRevenue >= milestone && !shownMilestones.includes(milestone)) {
          alerts.push({
            type: "milestone",
            title: `🎉 Félicitations ! ${milestone / 1000}k€ atteints !`,
            description: "Tu progresses vers ton objectif 100k !",
            severity: "success"
          });
          shownMilestones.push(milestone);
          sessionStorage.setItem(sessionKey, JSON.stringify(shownMilestones));
          break; // Only show one milestone at a time
        }
      }
      
      // Show toasts with delay between each
      alerts.forEach((alert, index) => {
        setTimeout(() => {
          const toastFn = alert.severity === "error" 
            ? toast.error 
            : alert.severity === "warning" 
              ? toast.warning 
              : alert.severity === "success"
                ? toast.success
                : toast.info;
          
          toastFn(alert.title, {
            description: alert.description,
            duration: 8000,
            action: alert.action ? {
              label: alert.action.label,
              onClick: () => navigate(alert.action!.path)
            } : undefined
          });
        }, index * 1500);
      });
      
      setHasShownNotifications(true);
    }, 1000); // Wait 1s for data to settle
    
    return () => clearTimeout(timer);
  }, [user, hasShownNotifications, transactionsLoading, transactions, urgentCount, urgentProjects, taskStats, navigate]);
}
