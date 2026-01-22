import { GlassCard } from "./GlassCard";
import { TrendingUp, ChevronRight } from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { month: "Jan", revenue: 2400 },
  { month: "Feb", revenue: 1398 },
  { month: "Mar", revenue: 4800 },
  { month: "Apr", revenue: 3908 },
  { month: "May", revenue: 4800 },
  { month: "Jun", revenue: 3800 },
  { month: "Jul", revenue: 6300 },
  { month: "Aug", revenue: 8200 },
];

export function RevenueWidget() {
  const currentRevenue = data[data.length - 1].revenue;
  const previousRevenue = data[data.length - 2].revenue;
  const trend = ((currentRevenue - previousRevenue) / previousRevenue) * 100;

  return (
    <GlassCard className="col-span-2 row-span-2" segment="ecommerce" glowOnHover>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Revenue (YTD)</p>
          <p className="text-xs text-muted-foreground/60">Aug, 23 2023</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-segment-ecommerce/20 px-3 py-1 text-xs font-medium text-segment-ecommerce">
            <TrendingUp className="h-3 w-3" />
            Revenue
          </span>
          <button className="rounded-full p-1 hover:bg-secondary transition-colors">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="mb-2">
        <span className="text-3xl font-bold">€{currentRevenue.toLocaleString()}</span>
        <span
          className={`ml-2 text-sm ${
            trend > 0 ? "text-segment-ecommerce" : "text-destructive"
          }`}
        >
          {trend > 0 ? "+" : ""}
          {trend.toFixed(1)}%
        </span>
      </div>

      <div className="h-[180px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
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
              tickFormatter={(value) => `€${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
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
