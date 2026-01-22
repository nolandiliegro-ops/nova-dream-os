import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { GlassCard } from "@/components/dashboard/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, Zap, Brain, MessageSquare } from "lucide-react";

export default function Assistant() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in h-[calc(100vh-8rem)]">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Assistant <span className="text-gradient">IA</span>
          </h1>
          <p className="text-muted-foreground">
            Ton copilote intelligent pour atteindre 1M€
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 h-[calc(100%-5rem)]">
          {/* Chat Area */}
          <div className="lg:col-span-2 flex flex-col">
            <GlassCard className="flex-1 flex flex-col p-6">
              {/* Messages Area */}
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Bienvenue, Nono 👋</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Je suis ton assistant IA personnel. Pose-moi des questions sur tes finances, 
                  tes projets, ou demande-moi des conseils pour optimiser ton temps.
                </p>
                
                {/* Quick actions */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {[
                    "Analyse mes revenus du mois",
                    "Quelle tâche prioriser ?",
                    "Résumé de mes projets",
                    "Conseils pour le million",
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Input Area */}
              <div className="border-t border-border/50 pt-4 mt-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Pose ta question..."
                    className="flex-1"
                  />
                  <Button size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Propulsé par Gemini · Phase 2 du développement
                </p>
              </div>
            </GlassCard>
          </div>

          {/* Capabilities Sidebar */}
          <div className="space-y-4">
            <GlassCard className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Capacités IA</h3>
                  <p className="text-xs text-muted-foreground">Ce que je peux faire</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { icon: Brain, label: "Analyse financière", desc: "Insights sur tes revenus" },
                  { icon: Zap, label: "Optimisation temps", desc: "Priorisation intelligente" },
                  { icon: MessageSquare, label: "Conseils business", desc: "Stratégies croissance" },
                ].map((cap) => (
                  <div key={cap.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <cap.icon className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{cap.label}</p>
                      <p className="text-xs text-muted-foreground">{cap.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <h3 className="font-semibold mb-3">Prochaines fonctionnalités</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-segment-tiktok" />
                  Génération de rapports
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-segment-consulting" />
                  Prédictions de revenus
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-segment-oracle" />
                  Automatisation tâches
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
