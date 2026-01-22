import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, Palette, Target, LogOut } from "lucide-react";

export default function Settings() {
  const { user, signOut } = useAuth();

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
              <Input id="name" placeholder="Ton nom" />
            </div>
          </div>
          
          <Button className="mt-4">Sauvegarder</Button>
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
              <Input id="revenue-goal" type="number" defaultValue="1000000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projects-goal">Objectif projets</Label>
              <Input id="projects-goal" type="number" defaultValue="12" />
            </div>
          </div>
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
