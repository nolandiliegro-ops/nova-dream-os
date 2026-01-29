import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Copy, 
  Check, 
  RefreshCw, 
  Save, 
  Loader2,
  Webhook,
  Mail,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useApiConfig, useApiConfigs, useUpsertApiConfig, useApiStatus } from "@/hooks/useApiConfigs";
import { useQueryClient } from "@tanstack/react-query";

// Generate a cryptographically secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

interface AutomationsSectionProps {
  webhookConfig: ReturnType<typeof useApiConfig>["data"];
  webhookLoading: boolean;
  webhookToken: string;
  setWebhookToken: (token: string) => void;
}

export function AutomationsSection({
  webhookConfig,
  webhookLoading,
  webhookToken,
  setWebhookToken,
}: AutomationsSectionProps) {
  const { data: allConfigs } = useApiConfigs();
  const { data: apiStatus, isLoading: apiStatusLoading, refetch: refetchApiStatus } = useApiStatus();
  const upsertApiConfig = useUpsertApiConfig();
  const queryClient = useQueryClient();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh API status handler
  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["api-status"] });
      await refetchApiStatus();
      toast.success("Statut des APIs actualisé !");
    } catch {
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setIsRefreshing(false);
    }
  };

  // The full webhook URL
  const webhookReceiverUrl = useMemo(() => {
    return `https://vdrxwdhexntbrhktddum.supabase.co/functions/v1/webhook-receiver?token=${webhookToken}`;
  }, [webhookToken]);

  // Email reminder endpoint
  const emailReminderUrl = useMemo(() => {
    return `https://vdrxwdhexntbrhktddum.supabase.co/functions/v1/send-deadline-reminder`;
  }, []);

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

  const handleTestEmailReminder = async () => {
    toast.info("Test du rappel email...");
    try {
      const response = await fetch(emailReminderUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(`Email envoyé ! ${data.reminders_sent} rappel(s)`);
      } else {
        toast.error(data.error || "Erreur lors du test");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  // Automation status list - dynamic based on API status
  const automations = useMemo(() => [
    {
      id: "webhook",
      name: "Webhook n8n",
      description: "Réception des ventes TikTok/Shopify/Stripe",
      icon: Webhook,
      status: webhookConfig ? "active" : "inactive",
      color: "segment-tiktok",
    },
    {
      id: "email",
      name: "Rappels Email",
      description: "Notifications 24h avant les deadlines",
      icon: Mail,
      status: apiStatusLoading ? "loading" : apiStatus?.resend ? "active" : "inactive",
      color: "segment-oracle",
    },
  ], [webhookConfig, apiStatus, apiStatusLoading]);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-segment-tiktok/20">
            <Zap className="h-5 w-5 text-segment-tiktok" />
          </div>
          <div>
            <h3 className="font-semibold">Automatisations</h3>
            <p className="text-xs text-muted-foreground">
              Gère tes intégrations et webhooks
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefreshStatus}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid gap-3 mb-6">
        {automations.map((automation) => (
          <div
            key={automation.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-md bg-${automation.color}/20`}>
                <automation.icon className={`h-4 w-4 text-${automation.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium">{automation.name}</p>
                <p className="text-xs text-muted-foreground">{automation.description}</p>
              </div>
            </div>
            <Badge
              variant={automation.status === "active" ? "default" : "secondary"}
              className={
                automation.status === "active"
                  ? "bg-segment-ecommerce/20 text-segment-ecommerce border-segment-ecommerce/30"
                  : automation.status === "loading"
                  ? "bg-muted text-muted-foreground animate-pulse"
                  : "bg-destructive/20 text-destructive border-destructive/30"
              }
            >
              {automation.status === "active" ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : automation.status === "loading" ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {automation.status === "active" ? "Configuré" : automation.status === "loading" ? "Vérification..." : "Non configuré"}
            </Badge>
          </div>
        ))}
      </div>

      {/* Webhook Configuration */}
      <div className="space-y-5 border-t border-border/50 pt-5">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Webhook className="h-4 w-4" />
          Configuration Webhook n8n
        </h4>

        {/* Webhook URL */}
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
        </div>

        {/* Token Secret */}
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

        <Button
          className="gap-2"
          onClick={handleSaveWebhook}
          disabled={upsertApiConfig.isPending || !webhookToken}
        >
          {upsertApiConfig.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Sauvegarder la configuration
        </Button>
      </div>

      {/* Email Reminders Section */}
      <div className="space-y-4 border-t border-border/50 pt-5 mt-5">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Rappels Email Automatiques
        </h4>

        <p className="text-sm text-muted-foreground">
          Nova envoie automatiquement un email 24h avant chaque deadline projet ou tâche prioritaire.
        </p>

        {/* Email Reminder URL (for CRON setup) */}
        <div className="space-y-2">
          <Label>URL Edge Function (pour CRON)</Label>
          <Input
            value={emailReminderUrl}
            readOnly
            className="bg-muted/50 font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Configure un CRON quotidien pour appeler cette URL (ex: chaque jour à 9h)
          </p>
        </div>

        <Button variant="outline" className="gap-2" onClick={handleTestEmailReminder}>
          <Mail className="h-4 w-4" />
          Tester l'envoi d'email
        </Button>
      </div>
    </GlassCard>
  );
}
