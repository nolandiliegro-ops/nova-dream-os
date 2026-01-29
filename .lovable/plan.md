
# Plan : Corriger le contenu coupe sur la droite des MissionCard

## Probleme identifie

En analysant les deux fichiers :

1. **MissionCard.tsx ligne 194** : Le conteneur `flex-1 min-w-0 overflow-hidden` a `overflow-hidden` qui coupe le texte a droite
2. La description (ligne 339) n'a pas de contrainte de largeur explicite
3. Le conteneur interne du header ne laisse pas assez d'espace pour le texte long

## Corrections a appliquer

### Fichier : MissionCard.tsx

| Ligne | Avant | Apres |
|-------|-------|-------|
| 194 | `flex-1 min-w-0 overflow-hidden` | `flex-1 min-w-0` (retirer overflow-hidden) |
| 339 | `text-xs text-muted-foreground mt-1 break-words whitespace-normal` | `text-xs text-muted-foreground mt-1 break-words whitespace-normal w-full` |

### Structure corrigee du header

La structure actuelle :
```text
+------------------------------------------+
| [Star] [Titre...] [Duration] [Deadline]  | [Status] [Actions]
|   (overflow-hidden coupe ici -->)        |
+------------------------------------------+
```

Structure apres correction :
```text
+------------------------------------------+
| [Star] [Titre complet sur              | | [Status] [Actions]
|         plusieurs lignes si besoin]    | |
| [Duration] [Deadline]                   | |
+------------------------------------------+
| Description complete visible            |
+------------------------------------------+
```

## Changements detailles

1. **Retirer overflow-hidden** (ligne 194)
   - Permet au texte de s'afficher completement
   - La carte s'ajustera en hauteur

2. **Ajouter w-full a la description** (ligne 339)
   - Garantit que la description occupe toute la largeur disponible

3. **S'assurer que le conteneur parent n'a pas de contrainte** 
   - ProjectRoadmapWidget a deja `pr-3` sur le conteneur, ce qui est correct

## Resultat attendu

- Le texte "P" (Planifiee) reste visible a droite
- Les titres longs s'affichent sur plusieurs lignes
- Les descriptions longues sont completement visibles
- Aucun contenu coupe sur les bords
