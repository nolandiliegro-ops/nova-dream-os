import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Loader2,
  Target,
  Link2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactionsBySegment, useTransactionsByProject } from "@/hooks/useTransactions";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface ProjectFinancesWidgetProps {
  projectId: string;
  segment: string;
  budget: number | null;
}

export function ProjectFinancesWidget({ projectId, segment, budget }: ProjectFinancesWidgetProps) {
  const navigate = useNavigate();
  const { data: segmentTransactions, isLoading: isLoadingSegment } = useTransactionsBySegment(segment);
  const { data: projectTransactions, isLoading: isLoadingProject } = useTransactionsByProject(projectId);

  const isLoading = isLoadingSegment || isLoadingProject;

  // Calculate segment totals
  const segmentTotals = segmentTransactions?.reduce(
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

  // Calculate project-specific totals
  const projectTotals = projectTransactions?.reduce(
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

  const segmentProfit = segmentTotals.revenue - segmentTotals.expenses;
  const projectProfit = projectTotals.revenue - projectTotals.expenses;
  const budgetProgress = budget ? (segmentTotals.expenses / budget) * 100 : 0;
  const hasProjectTransactions = projectTransactions && projectTransactions.length > 0;

  // Prepare chart data (last 6 months) - use segment transactions for chart
  const chartData = segmentTransactions
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
          onClick={() => navigate(`/finances?segment=${segment}&projectId=${projectId}`)}
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
          {/* Project-specific profit (if any project transactions) */}
          {hasProjectTransactions && (
            <div className={cn(
              "p-3 rounded-lg text-center border-2 border-dashed",
              projectProfit >= 0 ? "bg-segment-ecommerce/10 border-segment-ecommerce/30" : "bg-destructive/10 border-destructive/30"
            )}>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Link2 className="h-3 w-3" />
                <span>Profit projet (lié)</span>
              </div>
              <p className={cn(
                "text-2xl font-trading",
                projectProfit >= 0 ? "text-segment-ecommerce" : "text-destructive"
              )}>
                {projectProfit >= 0 ? "+" : ""}{projectProfit.toLocaleString('fr-FR')}€
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {projectTransactions?.length} transaction{projectTransactions && projectTransactions.length > 1 ? 's' : ''} liée{projectTransactions && projectTransactions.length > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Stats Grid - Segment level */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-segment-ecommerce/10">
              <div className="flex items-center gap-1 text-segment-ecommerce mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Revenus segment</span>
              </div>
              <p className="font-bold">{segmentTotals.revenue.toLocaleString('fr-FR')}€</p>
            </div>

            <div className="p-3 rounded-lg bg-destructive/10">
              <div className="flex items-center gap-1 text-destructive mb-1">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs">Dépenses segment</span>
              </div>
              <p className="font-bold">{segmentTotals.expenses.toLocaleString('fr-FR')}€</p>
            </div>
          </div>

          {/* Segment Profit */}
          <div className={cn(
            "p-3 rounded-lg text-center",
            segmentProfit >= 0 ? "bg-segment-ecommerce/10" : "bg-destructive/10"
          )}>
            <span className="text-xs text-muted-foreground">Profit segment</span>
            <p className={cn(
              "text-2xl font-trading",
              segmentProfit >= 0 ? "text-segment-ecommerce" : "text-destructive"
            )}>
              {segmentProfit >= 0 ? "+" : ""}{segmentProfit.toLocaleString('fr-FR')}€
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
                  {segmentTotals.expenses.toLocaleString('fr-FR')}€ / {budget.toLocaleString('fr-FR')}€
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
          {(!segmentTransactions || segmentTransactions.length === 0) && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune transaction pour ce segment</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate(`/finances?segment=${segment}&projectId=${projectId}`)}
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
