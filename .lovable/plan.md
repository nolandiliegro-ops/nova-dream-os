
# Plan : Ajouter les colonnes de liaison aux documents

## Objectif

Ajouter les colonnes `link_type`, `link_id` et `link_name` a la table `documents` pour permettre une liaison propre entre les rapports d'import et leurs projets associes.

## Etape 1 : Migration SQL

Ajouter 3 colonnes optionnelles a la table `documents` :

```sql
ALTER TABLE public.documents 
ADD COLUMN link_type text,
ADD COLUMN link_id uuid,
ADD COLUMN link_name text;

COMMENT ON COLUMN public.documents.link_type IS 'Type de ressource liee (project, mission, task, etc.)';
COMMENT ON COLUMN public.documents.link_id IS 'ID de la ressource liee';
COMMENT ON COLUMN public.documents.link_name IS 'Nom de la ressource liee pour affichage';
```

| Colonne | Type | Nullable | Description |
|---------|------|----------|-------------|
| link_type | text | Oui | Type de ressource (ex: 'project') |
| link_id | uuid | Oui | ID de la ressource liee |
| link_name | text | Oui | Nom affichable de la ressource |

## Etape 2 : Modifier useSaveImportReport.ts

### Modifications

1. Ajouter `projectName` aux parametres de la fonction
2. Remplacer `segment: projectId` par les nouvelles colonnes :
   - `link_type: 'project'`
   - `link_id: projectId`
   - `link_name: projectName`
   - `segment: null` (pour compatibilite)

```text
Interface SaveImportReportParams :
  - projectId: string
  - projectName: string    <-- NOUVEAU
  - reportTitle: string
  - reportContent: string
  - userId: string

Insert documents :
  - link_type: 'project'   <-- NOUVEAU
  - link_id: projectId     <-- NOUVEAU
  - link_name: projectName <-- NOUVEAU
  - segment: null          <-- MODIFIE (etait projectId)
```

## Etape 3 : Modifier useImportReports.ts

### Modifications

Remplacer le filtre `.ilike("name", ...)` par des filtres exacts sur les nouvelles colonnes :

```text
Avant :
  .eq("category", "report")
  .ilike("name", `%${projectId}%`)

Apres :
  .eq("category", "report")
  .eq("link_type", "project")
  .eq("link_id", projectId)
```

## Etape 4 : Mettre a jour l'appel dans BulkImportMissionDialog

Ajouter `projectName` lors de l'appel a `saveImportReport.mutate()` :

```text
Avant :
  saveImportReport.mutate({
    projectId,
    reportTitle,
    reportContent,
    userId: user.id,
  });

Apres :
  saveImportReport.mutate({
    projectId,
    projectName: project?.name || 'Projet inconnu',
    reportTitle,
    reportContent,
    userId: user.id,
  });
```

## Resume des fichiers

| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter colonnes link_type, link_id, link_name |
| `src/hooks/useSaveImportReport.ts` | Ajouter projectName, utiliser nouvelles colonnes |
| `src/hooks/useImportReports.ts` | Filtrer par link_type et link_id |
| `src/components/project-workspace/BulkImportMissionDialog.tsx` | Passer projectName |

## Resultat attendu

- Les rapports d'import sont correctement lies aux projets via `link_id`
- Le filtrage est precis (plus de recherche approximative dans le nom)
- Le nom du projet est stocke pour affichage futur
- Compatibilite avec les anciens documents (colonnes nullables)
