import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  X, 
  ListTodo, 
  DollarSign, 
  FolderPlus,
  StickyNote,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ActionType = "CREATE_TASK" | "ADD_REVENUE" | "CREATE_PROJECT" | "CREATE_NOTE";

export interface ActionParams {
  title?: string;
  amount?: string;
  segment?: string;
  priority?: string;
  date?: string;
  description?: string;
  content?: string;
}

interface ActionCardProps {
  type: ActionType;
  params: ActionParams;
  onConfirm: () => void;
  onCancel: () => void;
  isExecuting?: boolean;
  isExecuted?: boolean;
}

const actionConfigs: Record<ActionType, { 
  icon: typeof ListTodo; 
  title: string; 
  color: string 
}> = {
  CREATE_TASK: {
    icon: ListTodo,
    title: "Créer une tâche",
    color: "text-blue-500",
  },
  ADD_REVENUE: {
    icon: DollarSign,
    title: "Ajouter un revenu",
    color: "text-green-500",
  },
  CREATE_PROJECT: {
    icon: FolderPlus,
    title: "Créer un projet",
    color: "text-purple-500",
  },
  CREATE_NOTE: {
    icon: StickyNote,
    title: "Créer une note",
    color: "text-yellow-500",
  },
};

export const ActionCard = ({
  type,
  params,
  onConfirm,
  onCancel,
  isExecuting = false,
  isExecuted = false,
}: ActionCardProps) => {
  // Safe access with fallback to prevent "Cannot read properties of undefined"
  const config = actionConfigs[type] || actionConfigs.CREATE_TASK;
  const Icon = config.icon;

  const getParamsDisplay = () => {
    const items: { label: string; value: string }[] = [];

    if (params.title) {
      items.push({ label: "Titre", value: params.title });
    }
    if (params.amount) {
      items.push({ label: "Montant", value: `${params.amount} €` });
    }
    if (params.segment) {
      items.push({ label: "Segment", value: params.segment });
    }
    if (params.priority) {
      items.push({ label: "Priorité", value: params.priority });
    }
    if (params.date) {
      items.push({ label: "Date", value: params.date });
    }

    return items;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-xl border p-4 max-w-sm",
        "bg-background/80 backdrop-blur-xl",
        "border-border/50",
        isExecuted && "border-green-500/50 bg-green-500/5"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg",
          "bg-muted/50"
        )}>
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>
        <div>
          <p className="font-medium text-sm">{config.title}</p>
          {isExecuted && (
            <p className="text-xs text-green-500 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Exécuté avec succès
            </p>
          )}
        </div>
      </div>

      {/* Params */}
      <div className="space-y-1.5 mb-4">
        {getParamsDisplay().map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{item.label}:</span>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      {!isExecuted && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isExecuting}
            className="flex-1 gap-2"
          >
            {isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirmer
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={isExecuting}
            className="gap-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};
