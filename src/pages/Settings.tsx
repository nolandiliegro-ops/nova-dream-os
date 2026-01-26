import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { AutomationsSection } from "@/components/settings/AutomationsSection";
import { SegmentsManagerSection } from "@/components/settings/SegmentsManagerSection";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, Palette, Target, LogOut, Loader2, Save, Download } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useUserGoals, useUpdateUserGoals } from "@/hooks/useUserGoals";
import { useApiConfig } from "@/hooks/useApiConfigs";
import { useMode } from "@/contexts/ModeContext";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Generate a random token
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const { mode } = useMode();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: goals, isLoading: goalsLoading } = useUserGoals(2026, mode);
  const { data: webhookConfig, isLoading: webhookLoading } = useApiConfig("n8n_webhook");
  const updateProfile = useUpdateProfile();
  const updateGoals = useUpdateUserGoals();

  const [fullName, setFullName] = useState("");
  const [revenueGoal, setRevenueGoal] = useState(1000000);
  const [projectsGoal, setProjectsGoal] = useState(12);
  const [dailyCapacity, setDailyCapacity] = useState(360);
  const [webhookToken, setWebhookToken] = useState("");

  // Sync state with fetched data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
    }
  }, [profile]);

  useEffect(() => {
    if (goals) {
      setRevenueGoal(Number(goals.annual_revenue_goal));
      setProjectsGoal(goals.annual_projects_goal);
      setDailyCapacity(goals.daily_focus_capacity || 360);
    }
  }, [goals]);

  // Sync webhook token with fetched data
  useEffect(() => {
    if (webhookConfig?.config && typeof webhookConfig.config === "object" && !Array.isArray(webhookConfig.config)) {
      const config = webhookConfig.config as { webhook_token?: string };
      if (config.webhook_token) {
        setWebhookToken(config.webhook_token);
      } else {
        setWebhookToken(generateToken());
      }
    } else if (!webhookLoading && !webhookConfig) {
      setWebhookToken(generateToken());
    }
  }, [webhookConfig, webhookLoading]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ full_name: fullName });
      toast.success("Profil mis à jour !");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleSaveGoals = async () => {
    try {
      await updateGoals.mutateAsync({
        year: 2026,
        mode,
        goals: {
          annual_revenue_goal: revenueGoal,
          annual_projects_goal: projectsGoal,
          daily_focus_capacity: dailyCapacity,
        },
      });
      toast.success(`Objectifs ${mode === "work" ? "Work" : "Perso"} 2026 mis à jour ! 🎯`);
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    const loadingToast = toast.loading("Préparation de l'export...");
    
    try {
      const [projectsRes, tasksRes, transactionsRes, documentsRes, profileRes, goalsRes] = await Promise.all([
        supabase.from("projects").select("*").eq("user_id", user.id),
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("transactions").select("*").eq("user_id", user.id),
        supabase.from("documents").select("id, name, category, segment, description, created_at").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("user_goals").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        version: "Nova Dream 1.0",
        profile: profileRes.data,
        goals: goalsRes.data,
        projects: projectsRes.data || [],
        tasks: tasksRes.data || [],
        transactions: transactionsRes.data || [],
        documents: documentsRes.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `nova-dream-export-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.dismiss(loadingToast);
      toast.success("Export terminé ! 📦");
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Erreur lors de l'export");
    }
  };

  const isLoading = profileLoading || goalsLoading || webhookLoading;
  const isSaving = updateProfile.isPending || updateGoals.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Paramètres
          </h1>
          <p className="text-muted-foreground">
            Configure ton espace Nova Life OS
          </p>
        </div>

        {/* Profile Section */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Profil</h3>
              <p className="text-xs text-muted-foreground">Tes informations personnelles</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input 
                id="name" 
                placeholder="Ton nom" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <Button 
            className="mt-4 gap-2" 
            onClick={handleSaveProfile}
            disabled={isSaving}
          >
            {updateProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Sauvegarder
          </Button>
        </GlassCard>

        {/* Objectifs Section */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${mode === "work" ? "bg-segment-ecommerce/20" : "bg-segment-data/20"}`}>
                <Target className={`h-5 w-5 ${mode === "work" ? "text-segment-ecommerce" : "text-segment-data"}`} />
              </div>
              <div>
                <h3 className="font-semibold">Objectifs 2026</h3>
                <p className="text-xs text-muted-foreground">Configure tes objectifs annuels</p>
              </div>
            </div>
            <Badge variant={mode === "work" ? "default" : "secondary"} className="font-trading">
              {mode === "work" ? "MODE WORK" : "MODE PERSO"}
            </Badge>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="revenue-goal">
                {mode === "work" ? "Objectif CA annuel (€)" : "Objectif épargne/loisirs (€)"}
              </Label>
              <Input 
                id="revenue-goal" 
                type="number" 
                value={revenueGoal}
                onChange={(e) => setRevenueGoal(Number(e.target.value))}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Objectif actuel : {revenueGoal.toLocaleString('fr-FR')}€
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projects-goal">Objectif projets</Label>
              <Input 
                id="projects-goal" 
                type="number" 
                value={projectsGoal}
                onChange={(e) => setProjectsGoal(Number(e.target.value))}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Nombre de projets à livrer en 2026
              </p>
            </div>
          </div>

          {/* Daily Focus Capacity */}
          <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label htmlFor="daily-capacity" className="text-sm font-medium">
                  Capacité Focus Journalière
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Heures de travail productif par jour
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-trading text-primary">
                  {Math.floor(dailyCapacity / 60)}h{dailyCapacity % 60 > 0 ? `${dailyCapacity % 60}` : ""}
                </span>
                <p className="text-xs text-muted-foreground">/ jour</p>
              </div>
            </div>
            <Input 
              id="daily-capacity" 
              type="range" 
              min={60}
              max={720}
              step={30}
              value={dailyCapacity}
              onChange={(e) => setDailyCapacity(Number(e.target.value))}
              disabled={isLoading}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1h</span>
              <span>6h (recommandé)</span>
              <span>12h</span>
            </div>
          </div>
          
          <Button 
            className="mt-4 gap-2" 
            onClick={handleSaveGoals}
            disabled={isSaving}
          >
            {updateGoals.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Sauvegarder les objectifs
          </Button>
        </GlassCard>

        {/* Segments Manager Section */}
        <SegmentsManagerSection />

        {/* Automations Section */}
        <AutomationsSection
          webhookConfig={webhookConfig}
          webhookLoading={webhookLoading}
          webhookToken={webhookToken}
          setWebhookToken={setWebhookToken}
        />

        {/* Notifications Section */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-segment-oracle/20">
              <Bell className="h-5 w-5 text-segment-oracle" />
            </div>
            <div>
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-xs text-muted-foreground">Gère tes alertes</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              { label: "Rappels de deadlines", desc: "Notification 24h avant" },
              { label: "Résumé hebdomadaire", desc: "Chaque lundi matin" },
              { label: "Alertes finances", desc: "Quand un objectif est atteint" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Appearance Section */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-segment-tiktok/20">
              <Palette className="h-5 w-5 text-segment-tiktok" />
            </div>
            <div>
              <h3 className="font-semibold">Apparence</h3>
              <p className="text-xs text-muted-foreground">Personnalise l'interface</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mode sombre</p>
                <p className="text-xs text-muted-foreground">Activer le thème sombre</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Animations</p>
                <p className="text-xs text-muted-foreground">Effets de transition</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </GlassCard>

        {/* Security Section */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-segment-consulting/20">
              <Shield className="h-5 w-5 text-segment-consulting" />
            </div>
            <div>
              <h3 className="font-semibold">Sécurité</h3>
              <p className="text-xs text-muted-foreground">Protège ton compte</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2">
                Changer le mot de passe
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleExportData}>
                <Download className="h-4 w-4" />
                Exporter mes données (JSON)
              </Button>
            </div>
            
            <div className="pt-4 border-t border-border/50">
              <Button 
                variant="destructive" 
                onClick={signOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
