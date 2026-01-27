
# Plan : Corriger les erreurs de build

## Analyse des erreurs

Les erreurs de build proviennent de 2 categories :

### Categorie 1 : Fichiers de rapport a supprimer (comme demande)

| Fichier | Probleme |
|---------|----------|
| `src/utils/generateImportReport.ts` | Import `MissionDiffResult` inexistant |
| `src/hooks/useSaveImportReport.ts` | Import `@/lib/supabase` incorrect |
| `BulkImportMissionDialog.tsx` | Imports et code lies aux rapports |

### Categorie 2 : Code dependant de la migration SQL non deployee

| Fichier | Probleme |
|---------|----------|
| `useSoftDeleteMission.ts` | Utilise `deleted_at` et `deleted_by` |
| `DeletedMissionsDialog.tsx` | Utilise `deleted_at` |
| `useMissionHistory.ts` | Table `mission_history` inexistante |
| `BulkImportMissionDialog.tsx` | Utilise `diff.action` au lieu de `diff.type` |

## Actions a realiser

### Etape 1 : Supprimer les fichiers de rapport

Supprimer les 2 fichiers demandes qui causent des erreurs directes :
- `src/utils/generateImportReport.ts`
- `src/hooks/useSaveImportReport.ts`

### Etape 2 : Nettoyer BulkImportMissionDialog.tsx

Modifications dans ce fichier :
- Supprimer les imports de `useSaveImportReport` et `generateImportReport`
- Supprimer l'import de `useAuth`
- Supprimer l'appel a `useSaveImportReport()` et `useAuth()`
- Supprimer le bloc de generation et sauvegarde du rapport dans `handleSubmit`
- Corriger la ligne 246 : utiliser `d.type === 'skip'` au lieu de `d.action === 'skip'`

### Etape 3 : Desactiver temporairement le soft delete et l'historique

Ces fonctionnalites dependent de la migration SQL non encore deployee. Options :

**Option A (recommandee)** : Commenter/neutraliser le code en attendant la migration
- Modifier `useSoftDeleteMission.ts` pour utiliser une suppression classique
- Modifier `useMissionHistory.ts` pour retourner un tableau vide
- Modifier `DeletedMissionsDialog.tsx` pour ne pas acceder a `deleted_at`

**Option B** : Supprimer completement ces fichiers
- Necessite de retirer les imports dans les composants qui les utilisent

Je recommande l'Option A car elle preserve le code pour quand la migration sera deployee.

## Resume des modifications

```text
Fichiers a SUPPRIMER :
  src/utils/generateImportReport.ts
  src/hooks/useSaveImportReport.ts

Fichiers a MODIFIER :
  src/components/project-workspace/BulkImportMissionDialog.tsx
    - Retirer imports rapport + useAuth
    - Retirer logique de rapport dans handleSubmit
    - Corriger d.action -> d.type

  src/hooks/useSoftDeleteMission.ts
    - Remplacer deleted_at/deleted_by par suppression classique
    - Retourner tableau vide pour useDeletedMissions

  src/hooks/useMissionHistory.ts
    - Retourner tableau vide (table inexistante)

  src/components/project-workspace/DeletedMissionsDialog.tsx
    - Adapter pour ne pas utiliser deleted_at
```

## Resultat attendu

Apres ces modifications :
- Zero erreur de build
- Fonctionnalite d'import intelligent conservee et fonctionnelle
- Soft delete et historique desactives temporairement (en attente de migration)
- Code preserve pour reactivation facile apres migration SQL
