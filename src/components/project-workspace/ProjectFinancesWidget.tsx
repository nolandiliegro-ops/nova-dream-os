import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Loader2,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactionsBySegment } from "@/hooks/useTransactions";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface ProjectFinancesWidgetProps {
  segment: string;
  budget: number | null;
}

export function ProjectFinancesWidget({ segment, budget }: ProjectFinancesWidgetProps) {
  const navigate = useNavigate();
  const { data: transactions, isLoading } = useTransactionsBySegment(segment);

  // Calculate totals
  const totals = transactions?.reduce(
    (acc, t) => {
      if (t.type === "income") {
        acc.revenue += Number(t.amount);
      } else {
        acc.expenses += Number(t.amount);
      }
      return acc;
    },
    { revenue: 0, expenses: 0 }
  ) || { revenue: 0, expenses: 0 };

  const profit = totals.revenue - totals.expenses;
  const budgetProgress = budget ? (totals.expenses / budget) * 100 : 0;

  // Prepare chart data (last 6 months)
  const chartData = transactions
    ?.reduce((acc: { date: string; revenue: number; expenses: number }[], t) => {
      const month = new Date(t.date).toLocaleDateString('fr-FR', { month: 'short' });
      const existing = acc.find(d => d.date === month);
      if (existing) {
        if (t.type === "income") existing.revenue += Number(t.amount);
        else existing.expenses += Number(t.amount);
      } else {
        acc.push({
          date: month,
          revenue: t.type === "income" ? Number(t.amount) : 0,
          expenses: t.type === "expense" ? Number(t.amount) : 0,
        });
      }
      return acc;
    }, [])
    .reverse()
    .slice(-6) || [];

  return (
    <GlassCard className="p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Finances</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate(`/finances?segment=${segment}`)}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-segment-ecommerce/10">
              <div className="flex items-center gap-1 text-segment-ecommerce mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Revenus</span>
              </div>
              <p className="font-bold">{totals.revenue.toLocaleString('fr-FR')}€</p>
            </div>

            <div className="p-3 rounded-lg bg-destructive/10">
              <div className="flex items-center gap-1 text-destructive mb-1">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs">Dépenses</span>
              </div>
              <p className="font-bold">{totals.expenses.toLocaleString('fr-FR')}€</p>
            </div>
          </div>

          {/* Profit */}
          <div className={cn(
            "p-3 rounded-lg text-center",
            profit >= 0 ? "bg-segment-ecommerce/10" : "bg-destructive/10"
          )}>
            <span className="text-xs text-muted-foreground">Profit net</span>
            <p className={cn(
              "text-xl font-bold",
              profit >= 0 ? "text-segment-ecommerce" : "text-destructive"
            )}>
              {profit >= 0 ? "+" : ""}{profit.toLocaleString('fr-FR')}€
            </p>
          </div>

          {/* Budget Progress */}
          {budget && budget > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Budget utilisé
                </span>
                <span className={cn(
                  "font-medium",
                  budgetProgress > 100 ? "text-destructive" : "text-foreground"
                )}>
                  {totals.expenses.toLocaleString('fr-FR')}€ / {budget.toLocaleString('fr-FR')}€
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-300",
                    budgetProgress > 100 ? "bg-destructive" : budgetProgress > 80 ? "bg-segment-oracle" : "bg-primary"
                  )}
                  style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Mini Chart */}
          {chartData.length > 0 && (
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--segment-ecommerce))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--segment-ecommerce))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('fr-FR')}€`]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--segment-ecommerce))" 
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Empty State */}
          {(!transactions || transactions.length === 0) && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune transaction pour ce segment</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate(`/finances?segment=${segment}`)}
                className="mt-2"
              >
                Ajouter une transaction
              </Button>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}
