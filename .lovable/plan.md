
# Plan Final : Corriger définitivement le rognage du texte + compatibilité mobile

## Problème identifié (cause racine)

La classe `.glass-card` dans `src/index.css` ligne 127 applique `overflow-hidden` à TOUTES les cartes :
```css
.glass-card {
  @apply rounded-2xl border backdrop-blur-2xl relative overflow-hidden;
  ...
}
```

Combiné avec :
- `pr-3` insuffisant dans `ProjectRoadmapWidget.tsx` ligne 66
- La scrollbar Radix qui se superpose au contenu
- Manque de `w-full` sur les conteneurs internes

## Corrections à appliquer

### 1. ProjectRoadmapWidget.tsx

| Ligne | Avant | Après |
|-------|-------|-------|
| 24 | `className="p-5 h-full flex flex-col"` | `className="p-5 h-full w-full flex flex-col overflow-visible"` |
| 66 | `className="pr-3"` | `className="pr-6 w-full"` |
| 72 | `className="relative"` | `className="relative w-full"` |
| 77 | `className="space-y-4"` | `className="space-y-4 w-full"` |

### 2. MissionCard.tsx

| Ligne | Avant | Après |
|-------|-------|-------|
| 178 | `className="relative pl-8"` | `className="relative pl-8 w-full"` |
| 191 | `className="glass-card rounded-2xl p-4 ..."` | `className="glass-card rounded-2xl p-4 pr-6 w-full overflow-visible ..."` |
| 193 | `className="flex items-start justify-between gap-2 mb-3"` | `className="flex items-start justify-between gap-2 mb-3 w-full"` |
| 194 | `className="flex-1 min-w-0"` | `className="flex-1 min-w-0 w-full"` |
| 195 | `className="flex items-start gap-2 flex-wrap"` | `className="flex items-start gap-2 flex-wrap w-full"` |
| 216 | Le bouton titre | Ajouter `[overflow-wrap:break-word]` pour les mots très longs |

### 3. Compatibilité mobile

- `pr-6` = 24px de padding à droite (suffisant pour desktop)
- Sur mobile : le padding est maintenu (`p-4 pr-6` = padding uniforme + extra à droite)
- `w-full` sur tous les conteneurs garantit une largeur flexible
- `break-words` + `whitespace-normal` + `[overflow-wrap:break-word]` gère les mots très longs
- `flex-wrap` permet aux badges de passer à la ligne si nécessaire

### 4. Pourquoi `overflow-visible` ?

La classe `overflow-visible` sur la carte MissionCard écrase le `overflow-hidden` de `.glass-card` sans modifier le style global (qui affecte d'autres composants).

## Fichiers impactés

| Fichier | Action |
|---------|--------|
| `src/components/project-workspace/ProjectRoadmapWidget.tsx` | Ajouter `w-full`, `overflow-visible`, augmenter `pr-6` |
| `src/components/project-workspace/MissionCard.tsx` | Ajouter `w-full`, `pr-6`, `overflow-visible`, `overflow-wrap` |

## Checklist de validation

- [ ] Badge "Planifiée" visible en entier (pas de "P" coupé)
- [ ] Titres longs s'affichent sur plusieurs lignes
- [ ] Descriptions complètes visibles
- [ ] Mots très longs (ex: "superlongmotquidépasselargemented") se coupent correctement
- [ ] Test mobile (iPhone, Android) : pas de rognage
- [ ] Test zoom navigateur 90%/100%/110% : rendu correct
- [ ] Scrollbar visible : pas de superposition avec le contenu
