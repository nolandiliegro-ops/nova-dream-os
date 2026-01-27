
# Plan : Ajouter le bouton Historique des Imports dans la Roadmap

## Probleme identifie

Le composant `ImportHistoryDialog` n'existe pas et le bouton Historique n'est pas present dans `ProjectRoadmapWidget.tsx`.

## Fichiers a creer

### 1. `src/components/project-workspace/ImportHistoryDialog.tsx`

Nouveau composant dialog qui affiche l'historique des rapports d'import de roadmap.

| Element | Description |
|---------|-------------|
| Props | `projectId`, `open`, `onOpenChange` |
| Query | Recupere les documents avec `category: 'report'` |
| Contenu | Liste des rapports avec date, nom, taille |
| Actions | Telecharger le rapport (via signed URL) |

Structure du composant :
```text
Dialog
  DialogHeader
    - Titre : "Historique des Imports"
    - Description : "Rapports generes lors des imports de roadmap"
  
  DialogContent
    - ScrollArea avec liste des rapports
    - Chaque rapport affiche :
      - Icone FileText
      - Nom du fichier
      - Date de creation (formatee)
      - Taille du fichier
      - Bouton telecharger (Download)
    
    - Etat vide si aucun rapport
```

### 2. `src/hooks/useImportReports.ts`

Nouveau hook pour recuperer les rapports d'import d'un projet specifique.

| Element | Description |
|---------|-------------|
| Input | `projectId` |
| Query | Filtre documents avec `category = 'report'` et nom contenant le projectId |
| Output | Liste des documents tries par date decroissante |

## Fichier a modifier

### 3. `src/components/project-workspace/ProjectRoadmapWidget.tsx`

Modifications exactes demandees :

1. **Imports a ajouter** (ligne 5) :
   - `History` depuis lucide-react
   - `ImportHistoryDialog` depuis `./ImportHistoryDialog`

2. **State a ajouter** (ligne 19) :
   ```typescript
   const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
   ```

3. **Bouton Historique** (avant ligne 33, avant "Import Rapide") :
   ```typescript
   <Button 
     onClick={() => setIsHistoryDialogOpen(true)}
     size="sm"
     variant="ghost"
     className="gap-1.5 rounded-2xl"
   >
     <History className="h-4 w-4" />
     <span className="hidden sm:inline">Historique</span>
   </Button>
   ```

4. **Dialog a ajouter** (apres ligne 109, apres BulkImportMissionDialog) :
   ```typescript
   <ImportHistoryDialog
     projectId={projectId}
     open={isHistoryDialogOpen}
     onOpenChange={setIsHistoryDialogOpen}
   />
   ```

## Structure de ImportHistoryDialog

```text
+-----------------------------------------------+
|  Historique des Imports                    X  |
|  Rapports generes lors des imports de roadmap |
+-----------------------------------------------+
|                                               |
|  +------------------------------------------+ |
|  | FileText  rapport-import-2026-01-27.md   | |
|  |           27 janv. 2026 - 2.4 KB         | |
|  |                              [Download]  | |
|  +------------------------------------------+ |
|                                               |
|  +------------------------------------------+ |
|  | FileText  rapport-import-2026-01-26.md   | |
|  |           26 janv. 2026 - 1.8 KB         | |
|  |                              [Download]  | |
|  +------------------------------------------+ |
|                                               |
+-----------------------------------------------+
```

## Resume des fichiers

| Fichier | Action |
|---------|--------|
| `src/hooks/useImportReports.ts` | CREER |
| `src/components/project-workspace/ImportHistoryDialog.tsx` | CREER |
| `src/components/project-workspace/ProjectRoadmapWidget.tsx` | MODIFIER |

## Resultat attendu

Apres implementation :
- Bouton "Historique" visible avant "Import Rapide" dans le header Roadmap
- Click ouvre un dialog avec la liste des rapports d'import
- Chaque rapport peut etre telecharge
- Ordre chronologique inverse (plus recent en premier)
