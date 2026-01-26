import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { ActionCard, ActionType, ActionParams } from "./ActionCard";
import { useCreateTask } from "@/hooks/useTasks";
import { useCreateTransaction } from "@/hooks/useTransactions";
import { useCreateProject } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ParsedAction {
  id: string;
  type: ActionType;
  params: ActionParams;
}

interface ActionCardRendererProps {
  content: string;
}

// Regex pour parser les actions [[ACTION:TYPE|param1=value1|param2=value2]]
const ACTION_REGEX = /\[\[ACTION:(\w+)\|([^\]]+)\]\]/g;

export const parseActions = (content: string): ParsedAction[] => {
  const actions: ParsedAction[] = [];
  let match;

  while ((match = ACTION_REGEX.exec(content)) !== null) {
    const type = match[1] as ActionType;
    const paramsString = match[2];
    
    // Parser les paramètres
    const params: ActionParams = {};
    paramsString.split("|").forEach((param) => {
      const [key, value] = param.split("=");
      if (key && value) {
        (params as any)[key.trim()] = value.trim();
      }
    });

    actions.push({
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      params,
    });
  }

  // Reset regex lastIndex
  ACTION_REGEX.lastIndex = 0;

  return actions;
};

export const removeActionsFromContent = (content: string): string => {
  return content.replace(ACTION_REGEX, "").trim();
};

export const ActionCardRenderer = ({ content }: ActionCardRendererProps) => {
  const { user } = useAuth();
  const createTask = useCreateTask();
  const createTransaction = useCreateTransaction();
  const createProject = useCreateProject();

  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());
  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set());
  const [dismissedActions, setDismissedActions] = useState<Set<string>>(new Set());

  const actions = parseActions(content);

  const handleConfirm = useCallback(async (action: ParsedAction) => {
    if (!user) {
      toast.error("Tu dois être connecté pour exécuter cette action");
      return;
    }

    setExecutingActions((prev) => new Set(prev).add(action.id));

    try {
      switch (action.type) {
        case "CREATE_TASK":
          await createTask.mutateAsync({
            title: action.params.title || "Nouvelle tâche",
            mode: "work",
            priority: (action.params.priority as "low" | "medium" | "high") || "medium",
            status: "todo",
            estimated_time: 0,
            time_spent: 0,
            subtasks: [],
            required_tools: [],
            project_id: null,
            mission_id: null,
            description: action.params.description || null,
            due_date: action.params.date || null,
            completed_at: null,
          });
          toast.success(`Tâche "${action.params.title}" créée !`);
          break;

        case "ADD_REVENUE":
          await createTransaction.mutateAsync({
            type: "income",
            amount: parseFloat(action.params.amount || "0"),
            segment: (action.params.segment as "consulting" | "data" | "ecommerce" | "oracle" | "other" | "tech" | "tiktok") || "other",
            date: action.params.date || new Date().toISOString().split("T")[0],
            mode: "work",
            counts_toward_goal: true,
            description: action.params.description || null,
            category: null,
            project_id: null,
          });
          toast.success(`Revenu de ${action.params.amount}€ ajouté !`);
          break;

        case "CREATE_PROJECT":
          await createProject.mutateAsync({
            name: action.params.title || "Nouveau projet",
            segment: (action.params.segment as "consulting" | "data" | "ecommerce" | "oracle" | "other" | "tech" | "tiktok") || "other",
            mode: "work",
            status: "planned",
            progress: 0,
            description: action.params.description || null,
            deadline: action.params.date || null,
            budget: null,
            revenue_generated: null,
          });
          toast.success(`Projet "${action.params.title}" créé !`);
          break;
      }

      setExecutedActions((prev) => new Set(prev).add(action.id));
    } catch (error) {
      console.error("Error executing action:", error);
      toast.error("Erreur lors de l'exécution de l'action");
    } finally {
      setExecutingActions((prev) => {
        const next = new Set(prev);
        next.delete(action.id);
        return next;
      });
    }
  }, [user, createTask, createTransaction, createProject]);

  const handleCancel = useCallback((actionId: string) => {
    setDismissedActions((prev) => new Set(prev).add(actionId));
  }, []);

  // Filtrer les actions visibles
  const visibleActions = actions.filter(
    (action) => !dismissedActions.has(action.id)
  );

  if (visibleActions.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <AnimatePresence mode="popLayout">
        {visibleActions.map((action) => (
          <ActionCard
            key={action.id}
            type={action.type}
            params={action.params}
            onConfirm={() => handleConfirm(action)}
            onCancel={() => handleCancel(action.id)}
            isExecuting={executingActions.has(action.id)}
            isExecuted={executedActions.has(action.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
