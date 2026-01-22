import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, Palette, Target, LogOut, Loader2, Save, Zap, Copy, Check, RefreshCw } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useUserGoals, useUpdateUserGoals } from "@/hooks/useUserGoals";
import { useApiConfig, useUpsertApiConfig } from "@/hooks/useApiConfigs";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

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
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: goals, isLoading: goalsLoading } = useUserGoals(2026);
  const { data: webhookConfig, isLoading: webhookLoading } = useApiConfig("n8n_webhook");
  const updateProfile = useUpdateProfile();
  const updateGoals = useUpdateUserGoals();
  const upsertApiConfig = useUpsertApiConfig();

  const [fullName, setFullName] = useState("");
  const [revenueGoal, setRevenueGoal] = useState(1000000);
  const [projectsGoal, setProjectsGoal] = useState(12);
  const [webhookToken, setWebhookToken] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // The full webhook URL to provide to n8n
  const webhookReceiverUrl = useMemo(() => {
    return `https://vdrxwdhexntbrhktddum.supabase.co/functions/v1/webhook-receiver?token=${webhookToken}`;
  }, [webhookToken]);

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
    }
  }, [goals]);

  // Sync webhook token with fetched data
  useEffect(() => {
    if (webhookConfig?.config && typeof webhookConfig.config === "object" && !Array.isArray(webhookConfig.config)) {
      const config = webhookConfig.config as { webhook_token?: string };
      if (config.webhook_token) {
        setWebhookToken(config.webhook_token);
      } else {
        // Generate a new token if none exists
        setWebhookToken(generateToken());
      }
    } else if (!webhookLoading && !webhookConfig) {
      // No config exists, generate a new token
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
        goals: {
          annual_revenue_goal: revenueGoal,
          annual_projects_goal: projectsGoal,
        },
      });
      toast.success("Objectifs 2026 mis à jour ! 🎯");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleSaveWebhook = async () => {
    try {
      await upsertApiConfig.mutateAsync({
        type: "n8n_webhook",
        name: "Webhook n8n",
        config: { webhook_token: webhookToken },
      });
      toast.success("Configuration webhook sauvegardée ! 🔗");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  const handleRegenerateToken = () => {
    const newToken = generateToken();
    setWebhookToken(newToken);
    toast.info("Nouveau token généré. N'oublie pas de sauvegarder !");
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookReceiverUrl);
      setCopiedUrl(true);
      toast.success("URL copiée !");
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(webhookToken);
      setCopiedToken(true);
      toast.success("Token copié !");
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  const isLoading = profileLoading || goalsLoading || webhookLoading;
  const isSaving = updateProfile.isPending || updateGoals.isPending || upsertApiConfig.isPending;

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
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-segment-ecommerce/20">
              <Target className="h-5 w-5 text-segment-ecommerce" />
            </div>
            <div>
              <h3 className="font-semibold">Objectifs 2026</h3>
              <p className="text-xs text-muted-foreground">Configure tes objectifs annuels</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="revenue-goal">Objectif CA annuel (€)</Label>
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

        {/* Automation Section - Enhanced */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-segment-tiktok/20">
              <Zap className="h-5 w-5 text-segment-tiktok" />
            </div>
            <div>
              <h3 className="font-semibold">Automatisation (n8n)</h3>
              <p className="text-xs text-muted-foreground">Configure ton webhook pour recevoir les ventes automatiquement</p>
            </div>
          </div>
          
          <div className="space-y-5">
            {/* Webhook URL - Read Only with Copy */}
            <div className="space-y-2">
              <Label>URL Webhook (à copier dans n8n)</Label>
              <div className="flex gap-2">
                <Input 
                  value={webhookReceiverUrl}
                  readOnly
                  className="bg-muted/50 font-mono text-xs"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleCopyUrl}
                  className="shrink-0"
                >
                  {copiedUrl ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Utilise cette URL dans ton workflow n8n pour envoyer les ventes à Nova Life OS
              </p>
            </div>

            {/* Token Secret with Copy and Regenerate */}
            <div className="space-y-2">
              <Label>Token Secret</Label>
              <div className="flex gap-2">
                <Input 
                  value={webhookToken}
                  readOnly
                  className="bg-muted/50 font-mono text-xs"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleCopyToken}
                  className="shrink-0"
                >
                  {copiedToken ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleRegenerateToken}
                  className="shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Ce token sécurise ton webhook. Ne le partage pas !
              </p>
            </div>

            {/* Payload Format */}
            <div className="rounded-lg bg-muted/30 p-4 border border-border/50">
              <p className="text-sm font-medium mb-2">Format JSON attendu :</p>
              <pre className="text-xs font-mono text-muted-foreground overflow-x-auto">
{`{
  "amount": 150.00,
  "source": "tiktok_shop", // ou "shopify", "stripe"
  "description": "Vente produit X",
  "date": "2026-03-15",
  "category": "Vente directe"
}`}
              </pre>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${webhookConfig ? 'bg-primary' : 'bg-muted-foreground'}`} />
              <span className="text-sm text-muted-foreground">
                {webhookConfig ? 'Webhook configuré et actif' : 'En attente de configuration'}
              </span>
            </div>
          </div>
          
          <Button 
            className="mt-4 gap-2" 
            onClick={handleSaveWebhook}
            disabled={isSaving || !webhookToken}
          >
            {upsertApiConfig.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Sauvegarder la configuration
          </Button>
        </GlassCard>

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
            <Button variant="outline" className="w-full sm:w-auto">
              Changer le mot de passe
            </Button>
            
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
