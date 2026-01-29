
# Plan : Afficher les titres et descriptions des missions sur plusieurs lignes

## Probleme identifie

Dans le composant `MissionCard.tsx`, les titres et descriptions des missions sont tronques :
- **Ligne 216** : Le titre utilise `truncate` et `max-w-[60%]` - coupe le texte
- **Ligne 219** : Le `<span>` interne utilise aussi `truncate`
- **Ligne 339** : La description utilise `line-clamp-2` - limite a 2 lignes

Le texte deborde et n'est pas lisible en entier.

## Corrections a appliquer

### 1. Titre de la mission (ligne 214-221)

| Avant | Apres |
|-------|-------|
| `className="... truncate ... max-w-[60%]"` | `className="... break-words whitespace-normal text-left ..."` |
| `<span className="truncate">` | `<span className="break-words">` |

Le titre pourra s'afficher sur plusieurs lignes si necessaire.

### 2. Description de la mission (ligne 338-341)

| Avant | Apres |
|-------|-------|
| `className="... line-clamp-2"` | `className="... break-words whitespace-normal"` |

La description complete sera visible.

### 3. Conteneur du header (ligne 195)

| Avant | Apres |
|-------|-------|
| `flex items-center gap-2 flex-wrap` | `flex items-start gap-2 flex-wrap` |

Aligner les elements en haut pour un meilleur rendu multi-lignes.

## Fichier impacte

| Fichier | Action |
|---------|--------|
| `src/components/project-workspace/MissionCard.tsx` | Retirer truncate, ajouter break-words et whitespace-normal |

## Resultat attendu

- Les titres longs s'affichent sur plusieurs lignes
- Les descriptions sont visibles en entier
- Plus de texte coupe sur la droite
- Meilleure lisibilite des missions detaillees
