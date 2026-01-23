import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useMode } from "@/contexts/ModeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Target, ArrowUpRight, ArrowDownRight, TrendingUp, Loader2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactions, useTransactionStats, useCreateTransaction } from "@/hooks/useTransactions";
import { useUserGoals } from "@/hooks/useUserGoals";
import { useProjects } from "@/hooks/useProjects";
import { toast } from "sonner";

const segments = [
  { value: "ecommerce", label: "E-commerce", color: "bg-segment-ecommerce" },
  { value: "tiktok", label: "TikTok", color: "bg-segment-tiktok" },
  { value: "consulting", label: "Consulting", color: "bg-segment-consulting" },
  { value: "oracle", label: "Oracle", color: "bg-segment-oracle" },
  { value: "data", label: "Les Enquêtes", color: "bg-segment-data" },
  { value: "tech", label: "Dream App", color: "bg-segment-tech" },
  { value: "other", label: "Autre", color: "bg-muted" },
];

export default function Finances() {
  const { mode } = useMode();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get("projectId");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    type: "income" as "income" | "expense",
    segment: "ecommerce" as "ecommerce" | "tiktok" | "consulting" | "oracle" | "data" | "tech" | "other",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    project_id: preselectedProjectId || null as string | null,
  });

  const { data: transactions, isLoading } = useTransactions(mode);
  const { data: projects } = useProjects(mode);
  const stats = useTransactionStats(mode);
  const createTransaction = useCreateTransaction();
  const { data: userGoals } = useUserGoals(2026);

  // Filter projects by selected segment
  const filteredProjects = projects?.filter(p => p.segment === formData.segment) || [];

  // Dynamic goal from user settings
  const objectif2026 = userGoals?.annual_revenue_goal ?? 1000000;
  const progressPercentage = (stats.totalRevenue / objectif2026) * 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createTransaction.mutateAsync({
        amount: parseFloat(formData.amount),
        type: formData.type,
        segment: formData.segment,
        category: formData.category || null,
        description: formData.description || null,
        date: formData.date,
        mode: mode,
        counts_toward_goal: true,
        project_id: formData.project_id,
      });
      
      toast.success("Transaction ajoutée !");
      setIsDialogOpen(false);
      setFormData({
        amount: "",
        type: "income",
        segment: "ecommerce",
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        project_id: null,
      });
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    }
  };

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
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter une transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Montant (€)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "income" | "expense") => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Revenu</SelectItem>
                        <SelectItem value="expense">Dépense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="segment">Segment</Label>
                  <Select
                    value={formData.segment}
                    onValueChange={(value: typeof formData.segment) => setFormData({ ...formData, segment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", s.color)} />
                            {s.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ex: Vente produit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description optionnelle"
                  />
                </div>

                {/* Project linking */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5" />
                    Projet associé (optionnel)
                  </Label>
                  <Select
                    value={formData.project_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, project_id: value === "none" ? null : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucun projet spécifique" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun projet spécifique</SelectItem>
                      {filteredProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {filteredProjects.length === 0 && formData.segment && (
                    <p className="text-xs text-muted-foreground">
                      Aucun projet dans ce segment
                    </p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={createTransaction.isPending}>
                  {createTransaction.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Ajouter"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
                <p className="text-sm text-muted-foreground">{objectif2026.toLocaleString('fr-FR')}€ de CA</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{stats.totalRevenue.toLocaleString('fr-FR')}€</p>
              <p className="text-sm text-muted-foreground">{progressPercentage.toFixed(1)}% atteint</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-segment-ecommerce transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
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
            <p className="mt-2 text-2xl font-bold">{stats.monthlyRevenue.toLocaleString('fr-FR')}€</p>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dépenses ce mois</span>
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.monthlyExpenses.toLocaleString('fr-FR')}€</p>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Profit net total</span>
              <TrendingUp className="h-4 w-4 text-segment-ecommerce" />
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.netProfit.toLocaleString('fr-FR')}€</p>
          </GlassCard>
          
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total revenus</span>
              <Target className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.totalRevenue.toLocaleString('fr-FR')}€</p>
          </GlassCard>
        </div>

        {/* Segments Breakdown */}
        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard className="p-6">
            <h3 className="mb-4 font-semibold">Revenus par segment</h3>
            <div className="space-y-4">
              {segments.slice(0, 4).map((segment) => {
                const amount = stats.revenueBySegment[segment.value] || 0;
                const maxAmount = Math.max(...Object.values(stats.revenueBySegment), 1);
                
                return (
                  <div key={segment.value} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{segment.label}</span>
                      <span className="font-medium">{amount.toLocaleString('fr-FR')}€</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div 
                        className={cn("h-full transition-all", segment.color)}
                        style={{ width: `${(amount / maxAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="mb-4 font-semibold">Transactions récentes</h3>
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : transactions && transactions.length > 0 ? (
                transactions.slice(0, 5).map((t) => (
                  <div 
                    key={t.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg bg-muted/30 p-3",
                      "border-l-4",
                      segments.find(s => s.value === t.segment)?.color.replace('bg-', 'border-')
                    )}
                  >
                    <div>
                      <p className="font-medium text-sm">{t.description || t.category || t.segment}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <p className={cn(
                      "font-semibold",
                      t.type === "income" ? "text-segment-ecommerce" : "text-destructive"
                    )}>
                      {t.type === "income" ? "+" : "-"}{Number(t.amount).toLocaleString('fr-FR')}€
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucune transaction pour le moment.<br />
                  <span className="text-sm">Clique sur "Nouvelle transaction" pour commencer.</span>
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
