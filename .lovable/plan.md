
# Plan : Generation Automatique de Rapports d'Import

## Objectif

Ajouter la generation automatique de rapports Markdown apres chaque import de roadmap. Le rapport sera sauvegarde dans la table `documents` et apparaitra dans la section Documents du projet.

## Fichiers a creer

### 1. `src/utils/generateImportReport.ts`

Nouveau fichier qui contient :
- Interface `ImportReportData` avec les donnees du rapport
- Fonction `generateImportReport()` qui genere le contenu Markdown
- Fonction `generateReportTitle()` qui genere le titre du document

Le rapport inclura :
- En-tete avec nom du projet, date et utilisateur
- Tableau resume (missions creees, modifiees, identiques)
- Section detaillee des missions creees
- Section detaillee des missions modifiees avec les changements (avant/apres)
- Liste des missions identiques
- Footer avec signature

### 2. `src/hooks/useSaveImportReport.ts`

Nouveau hook React Query qui :
- Cree un blob Markdown a partir du contenu
- Upload le fichier dans le bucket Storage `documents`
- Insere les metadonnees dans la table `documents`
- Invalide le cache des documents
- Affiche un toast de confirmation

Parametres :
- `projectId` : ID du projet
- `reportTitle` : Titre du document
- `reportContent` : Contenu Markdown
- `userId` : ID de l'utilisateur

## Fichier a modifier

### 3. `src/components/project-workspace/BulkImportMissionDialog.tsx`

Modifications :
1. Ajouter les imports necessaires
2. Ajouter les hooks `useAuth` et `useSaveImportReport`
3. Ajouter un hook `useProject` pour recuperer le nom du projet
4. Modifier `handleSubmit` pour generer et sauvegarder le rapport apres l'import

```text
Flux de handleSubmit modifie :
  1. Appliquer les missions (existant)
  2. Afficher le toast de succes (existant)
  3. Celebrer si > 3 missions (existant)
  4. [NOUVEAU] Generer le rapport Markdown
  5. [NOUVEAU] Sauvegarder dans Storage + documents
  6. [NOUVEAU] Toast "Rapport enregistre dans les Documents"
  7. Fermer le dialog (existant)
```

## Compatibilite des types

Les instructions utilisent les types corrects deja presents dans le codebase :
- `MissionDiff` depuis `./missionDiff`
- `diff.type` (valeurs: `'create'`, `'update'`, `'identical'`)
- `diff.parsedMission.title`, `diff.parsedMission.description`
- `diff.changes.description.old` / `.new`
- `diff.changes.estimatedDuration.old` / `.new`

## Structure du rapport genere

```text
# Rapport d'Import de Roadmap

**Projet :** [Nom du projet]
**Date :** 27 janvier 2026 a 14h30
**Importe par :** user@email.com

---

## Resume

| Action      | Nombre | Details                      |
|-------------|--------|------------------------------|
| Creees      | 5      | Nouvelles missions ajoutees  |
| Modifiees   | 2      | Missions mises a jour        |
| Identiques  | 3      | Aucune modification          |
| TOTAL       | 10     | Missions traitees            |

---

## MISSIONS CREEES (5)

### 1. Gestion des utilisateurs
**Description :** Authentification securisee...
**Duree estimee :** 3h

...

## MISSIONS MODIFIEES (2)

### 1. Tableau de bord
**Description :**
- Avant : Dashboard basique
- Apres : Dashboard avec metriques avancees

...
```

## Dependances existantes

Tous les elements necessaires sont deja en place :
- Table `documents` avec colonnes `category`, `segment`, `mode`
- Bucket Storage `documents` configure
- Hook `useAuth` pour l'utilisateur connecte
- Hook `useProject` pour recuperer le nom du projet
- Types `MissionDiff` compatibles

## Resultat attendu

Apres un import de roadmap :
1. Missions creees/mises a jour
2. Toast : "X missions creees - Y missions mises a jour"
3. Toast : "Rapport enregistre dans les Documents"
4. Le rapport apparait dans la section Documents du projet
5. Le rapport peut etre telecharge et consulte
