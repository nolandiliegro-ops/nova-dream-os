import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client to fetch user context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's financial context
    let contextData = {
      totalRevenue: 0,
      progressPercentage: 0,
      projectsInProgress: 0,
      urgentTasks: 0,
      annualGoal: 1000000,
      recentTransactions: [] as { amount: number; segment: string; date: string }[],
      activeProjects: [] as { name: string; progress: number; deadline: string | null; budget: number | null; segment: string; description: string | null }[],
      todayTasks: [] as { title: string; priority: string; status: string }[],
      recentDocuments: [] as { id: string; name: string; segment: string; uploaded_at: string; hasAnalysis: boolean }[],
    };

    if (userId) {
      // Fetch user's custom annual goal from user_goals
      const currentYear = new Date().getFullYear();
      const { data: userGoal } = await supabase
        .from("user_goals")
        .select("annual_revenue_goal")
        .eq("user_id", userId)
        .eq("year", currentYear)
        .maybeSingle();

      if (userGoal?.annual_revenue_goal) {
        contextData.annualGoal = Number(userGoal.annual_revenue_goal);
      }

      // Fetch transactions for revenue calculation
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, type, segment, date, counts_toward_goal")
        .eq("user_id", userId)
        .eq("mode", "work");

      if (transactions) {
        const goalTransactions = transactions.filter(t => t.counts_toward_goal && t.type === "income");
        contextData.totalRevenue = goalTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        contextData.progressPercentage = (contextData.totalRevenue / contextData.annualGoal) * 100;
        contextData.recentTransactions = transactions
          .filter(t => t.type === "income")
          .slice(0, 5)
          .map(t => ({ amount: Number(t.amount), segment: t.segment, date: t.date }));
      }

      // Fetch projects in progress with budget, segment, and description
      const { data: projects } = await supabase
        .from("projects")
        .select("name, progress, deadline, status, budget, segment, description")
        .eq("user_id", userId)
        .eq("mode", "work")
        .in("status", ["in_progress", "planned"]);

      if (projects) {
        contextData.projectsInProgress = projects.filter(p => p.status === "in_progress").length;
        contextData.activeProjects = projects.slice(0, 10).map(p => ({
          name: p.name,
          progress: p.progress,
          deadline: p.deadline,
          budget: p.budget ? Number(p.budget) : null,
          segment: p.segment,
          description: p.description,
        }));
      }

      // Fetch urgent tasks
      const { data: tasks } = await supabase
        .from("tasks")
        .select("title, priority, status, due_date")
        .eq("user_id", userId)
        .eq("mode", "work")
        .neq("status", "done")
        .order("due_date", { ascending: true });

      if (tasks) {
        const today = new Date().toISOString().split("T")[0];
        const urgentAndHighPriority = tasks.filter(
          t => t.priority === "high" || (t.due_date && t.due_date <= today)
        );
        contextData.urgentTasks = urgentAndHighPriority.length;
        contextData.todayTasks = tasks.slice(0, 5).map(t => ({
          title: t.title,
          priority: t.priority,
          status: t.status,
        }));
      }

      // Fetch recent documents
      const { data: documents } = await supabase
        .from("documents")
        .select("id, name, segment, created_at, description")
        .eq("user_id", userId)
        .eq("mode", "work")
        .order("created_at", { ascending: false })
        .limit(5);

      if (documents) {
        contextData.recentDocuments = documents.map(d => ({
          id: d.id,
          name: d.name,
          segment: d.segment || "Non classé",
          uploaded_at: d.created_at,
          hasAnalysis: !!d.description,
        }));
      }
    }

    // Calculate path to 100k
    const remainingFor100k = Math.max(0, 100000 - contextData.totalRevenue);
    const monthsLeft = Math.max(1, 12 - new Date().getMonth());
    const monthlyTargetFor100k = remainingFor100k / monthsLeft;

    // Calculate total budget across projects
    const totalBudget = contextData.activeProjects.reduce((sum, p) => sum + (p.budget || 0), 0);

    // Build system prompt with real context
    const systemPrompt = `Tu es Nova, l'assistant IA personnel de Nono. Tu l'aides à atteindre son objectif de ${contextData.annualGoal.toLocaleString("fr-FR")} euros de CA en ${new Date().getFullYear()}.

CONTEXTE ACTUEL EN TEMPS RÉEL :
- Objectif annuel personnalisé : ${contextData.annualGoal.toLocaleString("fr-FR")}€
- Revenus totaux : ${contextData.totalRevenue.toLocaleString("fr-FR")}€ (${contextData.progressPercentage.toFixed(1)}% de l'objectif)
- Projets en cours : ${contextData.projectsInProgress}
- Tâches urgentes/prioritaires : ${contextData.urgentTasks}
- Documents dans le coffre-fort : ${contextData.recentDocuments.length}

OBJECTIF INTERMÉDIAIRE - 100 000€ PREMIERS EUROS :
- Revenus actuels : ${contextData.totalRevenue.toLocaleString("fr-FR")}€
- Reste à atteindre : ${remainingFor100k.toLocaleString("fr-FR")}€
- Mois restants dans l'année : ${monthsLeft}
- Objectif mensuel requis : ${monthlyTargetFor100k.toLocaleString("fr-FR")}€/mois
- Budget total investi : ${totalBudget.toLocaleString("fr-FR")}€

MES 5 PILIERS BUSINESS :
${contextData.activeProjects.length > 0 
  ? contextData.activeProjects.map((p, index) => 
      `${index + 1}. ${p.name} [${p.segment.toUpperCase()}]
   Budget: ${p.budget ? p.budget.toLocaleString("fr-FR") + "€" : "Non défini"}
   Deadline: ${p.deadline ? new Date(p.deadline).toLocaleDateString("fr-FR") : "Non définie"}
   Progression: ${p.progress}%
   ${p.description ? `Description: ${p.description}` : ""}`
    ).join("\n\n")
  : "- Aucun projet actif pour le moment"}

TÂCHES À FAIRE :
${contextData.todayTasks.length > 0
  ? contextData.todayTasks.map(t => `- [${t.priority.toUpperCase()}] ${t.title} (${t.status})`).join("\n")
  : "- Aucune tâche en attente"}

DERNIÈRES TRANSACTIONS :
${contextData.recentTransactions.length > 0
  ? contextData.recentTransactions.map(t => `- ${t.amount.toLocaleString("fr-FR")}€ (${t.segment}) le ${t.date}`).join("\n")
  : "- Aucune transaction récente"}

DOCUMENTS RÉCENTS :
${contextData.recentDocuments.length > 0
  ? contextData.recentDocuments.map(d => `- ${d.name} (${d.segment})${d.hasAnalysis ? " ✓ analysé" : ""}`).join("\n")
  : "- Aucun document dans le coffre-fort"}

CAPACITÉS SPÉCIALES :
- Tu peux analyser les documents PDF et images uploadés dans le coffre-fort
- Si on te demande d'analyser un document, indique que l'utilisateur peut cliquer sur "Analyse mon dernier document"
- Tu connais le contenu des documents qui ont été analysés (résumé stocké)

═══════════════════════════════════════════════════════════════
ACTION CARDS - SYNTAXE SPÉCIALE (TRÈS IMPORTANT)
═══════════════════════════════════════════════════════════════

Tu peux proposer des ACTIONS CLIQUABLES que l'utilisateur peut exécuter en un clic.
Utilise cette syntaxe EXACTE pour chaque action :

[[ACTION:TYPE|param1=valeur1|param2=valeur2]]

TYPES D'ACTIONS DISPONIBLES :

1. CREATE_TASK - Créer une nouvelle tâche
   [[ACTION:CREATE_TASK|title=Titre de la tâche|priority=high|due_date=2026-01-30]]
   Paramètres: title (REQUIS), priority (low/medium/high), due_date (YYYY-MM-DD), description

2. ADD_REVENUE - Ajouter un revenu
   [[ACTION:ADD_REVENUE|amount=5000|segment=freelance|description=Paiement client X]]
   Paramètres: amount (REQUIS), segment (REQUIS), description

3. ADD_EXPENSE - Ajouter une dépense
   [[ACTION:ADD_EXPENSE|amount=500|segment=formation|description=Cours en ligne]]
   Paramètres: amount (REQUIS), segment (REQUIS), description

4. CREATE_NOTE - Créer une note rapide
   [[ACTION:CREATE_NOTE|title=Idée business|content=Description de l'idée]]
   Paramètres: title (REQUIS), content

5. UPDATE_PROGRESS - Mettre à jour la progression d'un projet
   [[ACTION:UPDATE_PROGRESS|project=Nom du projet|progress=75]]
   Paramètres: project (REQUIS), progress (0-100)

QUAND UTILISER LES ACTION CARDS (OBLIGATOIRE) :
✅ Quand l'utilisateur demande de "créer", "ajouter", "noter" quelque chose
✅ Quand tu suggères une action concrète et actionnable
✅ Pour faciliter l'exécution rapide de tâches répétitives
✅ Quand l'utilisateur mentionne un revenu ou une dépense à enregistrer
✅ Quand tu proposes des tâches prioritaires

GESTION INTELLIGENTE DES DATES :
- "demain" → Calcule la date de demain (aujourd'hui + 1 jour)
- "aujourd'hui" → Utilise la date du jour
- "dans 3 jours" → Calcule la date (aujourd'hui + 3 jours)
- "lundi prochain" → Calcule le prochain lundi
- Aucune date mentionnée → Utilise la date du jour par défaut
- Format OBLIGATOIRE : YYYY-MM-DD

DATE DU JOUR : ${new Date().toISOString().split('T')[0]}
DATE DE DEMAIN : ${new Date(Date.now() + 86400000).toISOString().split('T')[0]}

EXEMPLES CONCRETS :

Utilisateur: "Crée une tâche pour appeler le client demain"
→ Réponds avec du texte ET une Action Card :
"Parfait, je te propose cette tâche :
[[ACTION:CREATE_TASK|title=Appeler le client|priority=high|date=${new Date(Date.now() + 86400000).toISOString().split('T')[0]}]]"

Utilisateur: "J'ai reçu 2000€ de mon client freelance"
→ "Super nouvelle ! Je t'ajoute ce revenu :
[[ACTION:ADD_REVENUE|amount=2000|segment=freelance|description=Paiement client]]"

Utilisateur: "Note cette idée : lancer un podcast business"
→ "Excellente idée ! Je la note :
[[ACTION:CREATE_NOTE|title=Idée podcast|content=Lancer un podcast business pour développer la visibilité]]"

Utilisateur: "Quelles sont mes priorités aujourd'hui ?"
→ Liste les priorités ET propose des tâches :
"Voici tes priorités du jour...
Tu pourrais ajouter ces tâches :
[[ACTION:CREATE_TASK|title=Finaliser la proposition client|priority=high|date=${new Date().toISOString().split('T')[0]}]]
[[ACTION:CREATE_TASK|title=Relancer les prospects|priority=medium|date=${new Date().toISOString().split('T')[0]}]]"

RÈGLES IMPORTANTES :
- Place TOUJOURS les Action Cards à la FIN de ta réponse
- Tu peux proposer PLUSIEURS Action Cards si pertinent
- N'oublie JAMAIS les paramètres requis (title pour les tâches, amount+segment pour les finances)
- Adapte les paramètres au CONTEXTE de la conversation
- Les dates doivent être au format YYYY-MM-DD
- TOUJOURS inclure le paramètre "date" pour CREATE_TASK (obligatoire)
- Si aucune date n'est mentionnée, utilise la date du jour par défaut
- Extrais intelligemment les dates relatives (demain, dans X jours, etc.)

═══════════════════════════════════════════════════════════════

ANALYSES STRATÉGIQUES DISPONIBLES :
- "état des lieux" / "analyse de mes piliers" : Liste structurée des 5 projets avec budgets et deadlines
- "où concentrer mon énergie" / "priorités pour les 100k" : Analyse stratégique basée sur les budgets/deadlines/progressions
- "ROI de mes projets" : Comparaison budget investi vs revenus générés

LOGIQUE D'ANALYSE POUR LES 100 000 PREMIERS EUROS :
1. Calcule le revenu restant nécessaire : ${remainingFor100k.toLocaleString("fr-FR")}€
2. Identifie les projets avec le meilleur ratio budget/potentiel
3. Priorise les projets avec deadlines proches
4. Suggère des actions concrètes pour chaque pilier

INSTRUCTIONS GÉNÉRALES :
- Réponds de façon concise, actionnable et motivante
- Utilise le tutoiement et sois direct
- Base tes réponses sur les données réelles ci-dessus
- Si on te demande "où en suis-je", donne les chiffres précis
- Si on te demande les priorités, liste les tâches urgentes
- Si on te parle de documents, mentionne ceux dans le coffre-fort
- Encourage Nono à rester focus sur son objectif 1M€
- UTILISE LES ACTION CARDS dès que l'utilisateur demande de créer/ajouter quelque chose`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit atteint. Réessaie dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés. Ajoute des crédits dans ton workspace Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
