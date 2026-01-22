import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Finances() {
  const { mode } = useMode();

  // Objectif 2026: 1 000 000€
  const objectif2026 = 1000000;
  const currentRevenue = 125000; // Placeholder - sera connecté à la BDD
  const progressPercentage = (currentRevenue / objectif2026) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Finances <span className="text-gradient">2026</span>
            </h1>
            <p className="text-muted-foreground">
              {mode === "work" ? "Suivi de tes revenus business" : "Suivi de tes finances personnelles"}
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle transaction
          </Button>
        </div>

        {/* Objectif 1M€ Card */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Objectif 2026</h2>
                <p className="text-sm text-muted-foreground">1 000 000€ de CA</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{currentRevenue.toLocaleString('fr-FR')}€</p>
              <p className="text-sm text-muted-foreground">{progressPercentage.toFixed(1)}% atteint</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-segment-ecommerce transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
            {/* Milestone markers */}
            <div className="absolute inset-y-0 left-1/4 w-px bg-background/50" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-background/50" />
            <div className="absolute inset-y-0 left-3/4 w-px bg-background/50" />
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>0€</span>
            <span>250k€</span>
            <span>500k€</span>
            <span>750k€</span>
            <span>1M€</span>
          </div>
        </GlassCard>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Revenus ce mois</span>
              <ArrowUpRight className="h-4 w-4 text-segment-ecommerce" />
            </div>
            <p className="mt-2 text-2xl font-bold">32 450€</p>
            <p className="text-xs text-segment-ecommerce">+12.5% vs mois dernier</p>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dépenses ce mois</span>
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </div>
            <p className="mt-2 text-2xl font-bold">8 230€</p>
            <p className="text-xs text-destructive">+5.2% vs mois dernier</p>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Profit net</span>
              <TrendingUp className="h-4 w-4 text-segment-ecommerce" />
            </div>
            <p className="mt-2 text-2xl font-bold">24 220€</p>
            <p className="text-xs text-segment-ecommerce">Marge: 74.6%</p>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Projection annuelle</span>
              <Target className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">389 400€</p>
            <p className="text-xs text-muted-foreground">Basé sur la moyenne</p>
          </GlassCard>
        </div>

        {/* Segments Breakdown */}
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard className="p-6">
            <h3 className="mb-4 font-semibold">Revenus par segment</h3>
            <div className="space-y-4">
              {[
                { name: "E-commerce", amount: 45000, color: "bg-segment-ecommerce" },
                { name: "TikTok", amount: 35000, color: "bg-segment-tiktok" },
                { name: "Consulting", amount: 30000, color: "bg-segment-consulting" },
                { name: "Oracle", amount: 15000, color: "bg-segment-oracle" },
              ].map((segment) => (
                <div key={segment.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{segment.name}</span>
                    <span className="font-medium">{segment.amount.toLocaleString('fr-FR')}€</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div 
                      className={cn("h-full transition-all", segment.color)}
                      style={{ width: `${(segment.amount / 45000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="mb-4 font-semibold">Transactions récentes</h3>
            <div className="space-y-3">
              <p className="text-center text-muted-foreground py-8">
                Aucune transaction pour le moment.<br />
                <span className="text-sm">Clique sur "Nouvelle transaction" pour commencer.</span>
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
