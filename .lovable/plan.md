
Objectif
- Corriger définitivement l’illisibilité du texte sur mobile (320px) en appliquant partout la même règle “100% fiable” : styles inline CSS de wrap, et suppression des `truncate` (et assimilés) dans les composants ciblés.
- Éviter toute régression Desktop : conserver les layouts existants, mais permettre au texte de prendre plusieurs lignes.

Constat (à partir du code actuel)
- Plusieurs composants utilisent `truncate` (donc `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`) ce qui rend le texte inutilisable sur mobile si le conteneur est étroit.
- D’autres utilisent `break-words/whitespace-normal` + classes arbitraires (`[word-break:...]`) dans certains endroits (MissionCard). Sur certains navigateurs mobiles, la combinaison peut produire un rendu “caractères collés” (souvent lié à des règles de cassure agressives + layout compressé).
- Les zones réellement concernées dans ta liste existent bien :
  - TasksWidget: `<p className="... truncate">{task.title}</p>`
  - DailyBriefingWidget: tooltip + listes internes (TaskGroupSection + DailyTaskRow) utilisent `truncate`
  - MissionFocusWidget: projectName + mission title en `truncate`
  - DeadlineWidget: project name en `truncate`
  - HabitTrackerWidget: habit.title en `truncate`
  - ProjectTasksWidget: task.title en `truncate`
  - DailyTaskRow: task.title en `truncate`
  - MissionCard: titre + description utilisent encore des classes de wrap plutôt que le style inline demandé

Approche
1) Créer un style inline unique (réutilisé dans chaque fichier) :
   - `overflowWrap: 'break-word'`
   - `wordBreak: 'break-word'`
   - `whiteSpace: 'normal'`
   - `hyphens: 'auto'`
   + (option demandé) ajouter `wordWrap: 'break-word'` sur les conteneurs principaux quand pertinent (fallback legacy).

2) Remplacer partout les `truncate` ciblés par :
   - `min-w-0` sur les parents flex (quand nécessaire)
   - suppression de `truncate`
   - ajout du `style={TEXT_WRAP_STYLE}` sur l’élément texte (p/span/h4)
   - conserver si besoin une “limite visuelle” via `text-sm`/`font-medium` mais pas de limite de lignes.

3) Ajuster uniquement quand nécessaire les conteneurs flex :
   - Beaucoup de tes cellules ont déjà `flex-1 min-w-0`. On garde, mais on retire `truncate` et on laisse le texte wrap.
   - Quand un élément texte est dans une ligne `flex` avec des icônes/actions, on garde l’icône en `shrink-0` et on met le texte en `flex-1 min-w-0`.

Changements précis par fichier (ce que je vais implémenter)

A) src/components/project-workspace/MissionCard.tsx
- Ajouter une constante locale en haut du fichier (dans le module) :
  - `const TEXT_WRAP_STYLE: React.CSSProperties = { overflowWrap: 'break-word', wordBreak: 'break-word', whiteSpace: 'normal', hyphens: 'auto' };`
- Conteneur principal de carte (le div `glass-card ...`):
  - Ajouter `style={{ wordWrap: 'break-word' }}` (instruction #2 + fallback)
  - Conserver `!overflow-visible h-auto min-h-0` déjà présent
- Titre de mission (button ligne ~216)
  - Retirer `whitespace-normal break-words hyphens-auto [word-break:...] [overflow-wrap:...]`
  - Ajouter `style={TEXT_WRAP_STYLE}`
  - Garder `className="flex-1 min-w-0 text-left font-trading text-base ..."`
- Description mission (p ligne ~378)
  - Remplacer les classes `break-words whitespace-normal ...` par `style={TEXT_WRAP_STYLE}` + `style` additionnel `wordWrap: 'break-word'` si tu veux strictement appliquer ton point #1 à la lettre.
  - Conserver `className="text-xs text-muted-foreground w-full pl-8"`.

B) src/components/dashboard/TasksWidget.tsx
- Titre tâche (ligne 97)
  - Retirer `truncate`
  - Ajouter `style={TEXT_WRAP_STYLE}` sur le `<p>`
  - Garder `className="text-sm font-medium"` et s’assurer que le parent reste `flex-1 min-w-0` (il l’est déjà).

C) src/components/dashboard/DailyBriefingWidget.tsx
- Dans `CustomTooltip` :
  - Remplacer `<span className="truncate ...">{task.title}</span>` par :
    - `className="text-muted-foreground"`
    - `style={TEXT_WRAP_STYLE}`
    - éventuellement ajouter `max-w-[140px]` si tu veux éviter que la tooltip devienne gigantesque, mais sans “truncate”; on peut laisser wrap.
- Dans le widget principal, les tâches affichées passent via `TaskGroupSection` + `DailyTaskRow` :
  - Les corrections réelles seront donc surtout dans ces 2 composants (voir D et E).

D) src/components/dashboard/TaskGroupSection.tsx
- Le titre du groupe (ligne 51)
  - Aujourd’hui: `<span className="font-medium truncate max-w-[180px]">...`
  - Action:
    - Retirer `truncate` et `max-w-[180px]` (ou garder une largeur max mais avec wrap; pour “fix total”, on enlève la limite rigide)
    - Ajouter `style={TEXT_WRAP_STYLE}`
    - Conserver `className="font-medium"` + ajouter `min-w-0` sur le bouton si nécessaire (le bouton est déjà flex; on ajoutera `min-w-0` au bon endroit pour que le span puisse wrap).

E) src/components/dashboard/DailyTaskRow.tsx
- Titre tâche (span ligne ~170)
  - Retirer `truncate`
  - Ajouter `style={TEXT_WRAP_STYLE}`
  - Conserver l’interaction (onClick ouvre le dialog)
  - S’assurer que la zone gauche conserve `min-w-0 flex-1` (déjà le cas) pour que le texte wrap et ne pousse pas les icônes hors écran.

F) src/components/dashboard/MissionFocusWidget.tsx
- Project name (p ligne 283)
  - Retirer `truncate`
  - Ajouter `style={TEXT_WRAP_STYLE}`
- Mission title (h4 ligne 288)
  - Retirer `truncate`
  - Ajouter `style={TEXT_WRAP_STYLE}`
- Vérifier le conteneur cliquable :
  - Ajouter `className="min-w-0"` à la zone texte si besoin (pour que le wrap se fasse correctement en flex context).

G) src/components/dashboard/DeadlineWidget.tsx
- Nom du projet (p ligne 89)
  - Retirer `truncate`
  - Ajouter `style={TEXT_WRAP_STYLE}`
  - Optionnel (mais recommandé) : ajouter `leading-snug` pour améliorer la lisibilité multi-lignes.

H) src/components/dashboard/HabitTrackerWidget.tsx
- Nom de l’habitude (span ligne 206)
  - Retirer `truncate`
  - Ajouter `style={TEXT_WRAP_STYLE}`
  - Conserver `min-w-0` sur le parent (il est présent). Si besoin, ajouter `flex-1 min-w-0` au span pour qu’il prenne l’espace et wrap sans casser la grille.

I) src/components/project-workspace/ProjectTasksWidget.tsx
- Titre tâche (span ligne 158-163)
  - Retirer `truncate`
  - Ajouter `style={TEXT_WRAP_STYLE}`
  - Garder `flex-1` (déjà présent via `flex-1` dans className) + `min-w-0` si nécessaire.

Pourquoi “style inline” partout (et pas Tailwind)
- Tu veux une fiabilité maximale cross-browser mobile (Safari iOS / Chrome Android).
- Les classes utilitaires + classes arbitraires Tailwind peuvent être sensibles aux combinaisons (surtout si un parent a un `white-space` inattendu, ou si un composant réutilisé impose du nowrap).
- Le `style` inline applique directement les règles au nœud DOM, sans ambiguïté.

Tests (obligatoires) – mobile 320px
- Je vais tester en 320px dans l’aperçu :
  1) Ouvrir l’app en mode mobile (320px de largeur).
  2) Aller sur /projects/2d54579d-36f7-4ed3-bc70-a9797f0cd8e1 (route actuelle) et vérifier la Roadmap (MissionCard).
  3) Vérifier:
     - Missions (titre + description) lisibles, espaces normaux, retours à la ligne naturels.
     - Widget Tâches urgentes (TasksWidget) : titres multi-lignes.
     - Daily Briefing : titres dans les lignes (DailyTaskRow) + titres de groupe (TaskGroupSection) + tooltip.
     - Mission Focus : projectName + mission title multi-lignes.
     - DeadlineWidget : nom projet multi-lignes.
     - HabitTracker : noms habitudes multi-lignes (dans la grille).
     - ProjectTasksWidget : titres multi-lignes.
- Si un endroit affiche encore “caractères collés”, je vérifierai immédiatement si un parent applique une règle globale (ex: `white-space: nowrap`, `letter-spacing`, ou une font CSS) et je surchargerai au bon niveau avec `whiteSpace: 'normal'` (ce que ce plan fait déjà) et au besoin sur le parent.

Risques / points d’attention
- Quelques cartes/rows vont devenir plus hautes sur mobile (c’est le but). On vérifiera que les actions (icônes à droite) restent visibles et ne débordent pas.
- Les tooltips peuvent devenir plus hautes si un titre est très long. Si c’est gênant, on ajustera ensuite avec une largeur max + wrap (pas de truncate), mais seulement après validation que la lisibilité est revenue.

Livrable
- Modification de tous les composants listés pour supprimer `truncate` et appliquer le style inline de wrap sur les textes.
- Validation visuelle en 320px sur les routes/écrans concernés (notamment Project Workspace route fournie).
