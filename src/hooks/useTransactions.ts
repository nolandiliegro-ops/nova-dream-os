import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: "income" | "expense";
  segment: "ecommerce" | "tiktok" | "consulting" | "oracle" | "data" | "tech" | "other";
  category: string | null;
  description: string | null;
  date: string;
  mode: "work" | "personal";
  counts_toward_goal: boolean;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export type TransactionInsert = Omit<Transaction, "id" | "created_at" | "updated_at">;

export function useTransactions(mode?: "work" | "personal") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", mode],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (mode) {
        query = query.eq("mode", mode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });
}

export function useTransactionsBySegment(segment: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", "segment", segment],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("segment", segment!)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user && !!segment,
  });
}

// Hook pour récupérer les transactions d'un projet spécifique
export function useTransactionsByProject(projectId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["transactions", "project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("project_id", projectId!)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user && !!projectId,
  });
}

export function useTransactionStats(mode?: "work" | "personal") {
  const { data: transactions } = useTransactions(mode);

  const stats = {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    revenueBySegment: {} as Record<string, number>,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    goalProgress: 0,
  };

  if (transactions) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    transactions.forEach((t) => {
      const transactionDate = new Date(t.date);
      const isCurrentMonth =
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear;

      if (t.type === "income") {
        stats.totalRevenue += Number(t.amount);
        stats.revenueBySegment[t.segment] =
          (stats.revenueBySegment[t.segment] || 0) + Number(t.amount);

        if (isCurrentMonth) {
          stats.monthlyRevenue += Number(t.amount);
        }
      } else {
        stats.totalExpenses += Number(t.amount);
        if (isCurrentMonth) {
          stats.monthlyExpenses += Number(t.amount);
        }
      }
    });

    stats.netProfit = stats.totalRevenue - stats.totalExpenses;
    stats.goalProgress = (stats.totalRevenue / 1000000) * 100;
  }

  return stats;
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (transaction: Omit<TransactionInsert, "user_id">) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("transactions")
        .insert({ ...transaction, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
