import { motion } from "framer-motion";
import { Loader2, FileSearch, Database, Sparkles, Search, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export type LoadingAction = 
  | "thinking" 
  | "upload" 
  | "query" 
  | "create" 
  | "search"
  | "analyze";

interface LoadingMessageProps {
  action?: LoadingAction;
  className?: string;
}

const loadingConfigs: Record<LoadingAction, { message: string; icon: typeof Loader2 }> = {
  thinking: {
    message: "Nova réfléchit...",
    icon: Bot,
  },
  upload: {
    message: "Nova analyse le document...",
    icon: FileSearch,
  },
  query: {
    message: "Nova consulte tes données...",
    icon: Database,
  },
  create: {
    message: "Nova crée l'élément...",
    icon: Sparkles,
  },
  search: {
    message: "Nova recherche des informations...",
    icon: Search,
  },
  analyze: {
    message: "Nova analyse le contenu...",
    icon: FileSearch,
  },
};

export const LoadingMessage = ({ 
  action = "thinking", 
  className 
}: LoadingMessageProps) => {
  const config = loadingConfigs[action];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn("flex gap-3 justify-start", className)}
    >
      {/* Avatar Nova */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
        <Bot className="h-4 w-4 text-primary" />
      </div>

      {/* Message de chargement */}
      <div className="bg-muted/50 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-4 w-4 text-primary" />
          </motion.div>
          
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <motion.span
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm text-muted-foreground"
            >
              {config.message}
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
