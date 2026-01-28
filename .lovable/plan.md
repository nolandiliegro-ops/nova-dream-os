
# Plan : Remplacer les rapports Markdown par un historique en base de donnees

## Objectif

Migrer le systeme de rapports d'import (fichiers Markdown dans Storage) vers une table dediee `import_history` en base de donnees. Plus simple, plus rapide, plus fiable.

## Etape 1 : Migration SQL

Creer la table `import_history` avec la structure suivante :

```text
Table: import_history
+--------------------+-------------+-----------+--------------------------------+
| Colonne            | Type        | Nullable  | Description                    |
+--------------------+-------------+-----------+--------------------------------+
| id                 | uuid        | Non       | Cle primaire                   |
| user_id            | uuid        | Non       | FK vers auth.users             |
| project_id         | uuid        | Non       | FK vers projects               |
| project_name       | text        | Non       | Nom du projet (snapshot)       |
| created_count      | integer     | Non       | Missions creees                |
| updated_count      | integer     | Non       | Missions modifiees             |
| identical_count    | integer     | Non       | Missions identiques            |
| total_count        | integer     | Non       | Total traite                   |
| changes            | jsonb       | Non       | Details des modifications      |
| created_at         | timestamptz | Non       | Date de l'import               |
| mode               | text        | Non       | Mode (work/personal)           |
+--------------------+-------------+-----------+--------------------------------+

Index: user_id, project_id, created_at DESC, mode
RLS: SELECT, INSERT, DELETE pour user_id = auth.uid()
```

## Etape 2 : Creer le hook useSaveImportHistory.ts

Nouveau fichier `src/hooks/useSaveImportHistory.ts` :

- Fonction `saveImportHistory(projectId, projectName, diffs)`
- Compte automatiquement created/updated/identical
- Prepare le JSON des modifications avec details avant/apres
- Insere dans `import_history`
- Affiche un toast de confirmation

## Etape 3 : Creer ImportHistoryDialogNew.tsx

Nouveau fichier `src/components/project-workspace/ImportHistoryDialogNew.tsx` :

- Query React Query sur `import_history` filtre par `project_id`
- Affiche les imports par date avec statistiques
- Liste les modifications avec icones (+ vert, edit bleu, check gris)
- Affiche les details avant/apres pour les updates

## Etape 4 : Modifier BulkImportMissionDialog.tsx

Changements dans le fichier existant :

| Ligne | Avant | Apres |
|-------|-------|-------|
| 19 | `import { useSaveImportReport }` | `import { useSaveImportHistory }` |
| 20 | `import { generateImportReport, ... }` | Supprimer cette ligne |
| 195 | `const saveImportReport = useSaveImportReport()` | `const { saveImportHistory } = useSaveImportHistory()` |
| 236-258 | Bloc generation/sauvegarde Markdown | `await saveImportHistory(projectId, project?.name \|\| 'Projet', diffs)` |

## Etape 5 : Modifier ProjectRoadmapWidget.tsx

Changements dans le fichier existant :

| Ligne | Avant | Apres |
|-------|-------|-------|
| 10 | `import { ImportHistoryDialog }` | `import { ImportHistoryDialogNew }` |
| 122-126 | `<ImportHistoryDialog ... />` | `<ImportHistoryDialogNew ... />` |

## Fichiers supprimes (optionnel, nettoyage)

Ces fichiers ne seront plus utilises :

- `src/hooks/useSaveImportReport.ts`
- `src/hooks/useImportReports.ts`
- `src/components/project-workspace/ImportHistoryDialog.tsx`
- `src/utils/generateImportReport.ts`

## Resume des fichiers

| Fichier | Action |
|---------|--------|
| Migration SQL | Creer table `import_history` avec RLS |
| `src/hooks/useSaveImportHistory.ts` | Creer (copie du fichier fourni) |
| `src/components/project-workspace/ImportHistoryDialogNew.tsx` | Creer (copie du fichier fourni) |
| `src/components/project-workspace/BulkImportMissionDialog.tsx` | Modifier imports et logique de sauvegarde |
| `src/components/project-workspace/ProjectRoadmapWidget.tsx` | Modifier import du dialog |

## Avantages

- Plus de probleme de type MIME
- Historique consultable instantanement (pas de telechargement)
- Donnees structurees et filtrables
- Meilleure performance (requete DB vs lecture fichier)
- Nettoyage automatique possible (retention)
