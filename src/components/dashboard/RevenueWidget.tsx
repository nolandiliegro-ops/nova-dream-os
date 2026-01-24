import { GlassCard } from "./GlassCard";
import { TrendingUp, ChevronRight, Target } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTransactionStats, useTransactions } from "@/hooks/useTransactions";
import { useMode } from "@/contexts/ModeContext";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useUserGoals } from "@/hooks/useUserGoals";
import { cn } from "@/lib/utils";

export function RevenueWidget() {
  const { mode } = useMode();
  const stats = useTransactionStats(mode);
  const { data: transactions } = useTransactions(mode);
  const { data: userGoals } = useUserGoals(2026, mode);

  // Use dynamic goal from user settings - mode-specific defaults
  const defaultGoal = mode === "work" ? 1000000 : 50000;
  const objectif2026 = userGoals?.annual_revenue_goal ?? defaultGoal;

  // Mode-specific labels and styling
  const widgetTitle = mode === "work" ? "Objectif CA 2026" : "Budget Annuel 2026";
  const widgetSubtitle = mode === "work" ? "Chiffre d'affaires" : "Revenus personnels";
  const segmentStyle = mode === "work" ? "ecommerce" : "data";
  // Build chart data from real transactions
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      // Default placeholder data
      return [
        { month: "Jan", revenue: 0 },
        { month: "Fév", revenue: 0 },
        { month: "Mar", revenue: 0 },
      ];
    }

    const monthlyData: Record<string, number> = {};
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

    transactions
      .filter((t) => t.type === "income")
      .forEach((t) => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthLabel = monthNames[date.getMonth()];
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(t.amount);
      });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, revenue]) => {
        const [, monthIndex] = key.split("-");
        return {
          month: monthNames[parseInt(monthIndex)],
          revenue,
        };
      });
  }, [transactions]);

  const progressPercentage = (stats.totalRevenue / objectif2026) * 100;

  return (
    <GlassCard className="col-span-2 row-span-2" segment={segmentStyle} glowOnHover>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">{widgetTitle}</p>
          <p className="text-xs text-muted-foreground/60">{widgetSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
            mode === "work" 
              ? "bg-segment-ecommerce/20 text-segment-ecommerce"
              : "bg-segment-data/20 text-segment-data"
          )}>
            <Target className="h-3 w-3" />
            {progressPercentage.toFixed(1)}%
          </span>
          <Link to="/finances" className="rounded-full p-1 hover:bg-secondary transition-colors">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      <div className="mb-2">
        <span className="text-4xl font-trading">{stats.totalRevenue.toLocaleString('fr-FR')}€</span>
        <span className="ml-2 text-sm text-muted-foreground">
          / {objectif2026.toLocaleString('fr-FR')}€
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted mb-4">
        <div 
          className={cn(
            "absolute inset-y-0 left-0 transition-all duration-500",
            mode === "work" 
              ? "bg-gradient-to-r from-primary to-segment-ecommerce"
              : "bg-gradient-to-r from-segment-data to-segment-consulting"
          )}
          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
        />
      </div>

      <div className="h-[140px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--segment-ecommerce))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--segment-ecommerce))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => value >= 1000 ? `${value / 1000}k€` : `${value}€`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number) => [`${value.toLocaleString('fr-FR')}€`, "Revenu"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--segment-ecommerce))"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
