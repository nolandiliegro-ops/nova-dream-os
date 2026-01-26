

# Plan V5.1 Final : Exécution de la Migration SQL Manus

## Contexte

L'analyse du code montre que **toutes les protections côté application sont déjà en place**. La seule étape manquante est l'exécution de la migration SQL de Manus pour ajouter une contrainte UNIQUE au niveau de la base de données.

## Actions à réaliser

### 1. Exécuter la migration SQL de Manus

Appliquer la contrainte `UNIQUE (user_id, title)` sur la table `habits` pour garantir qu'aucun doublon ne peut être créé, même en cas de bug ou d'attaque directe sur l'API.

```text
┌─────────────────────────────────────────────────────────┐
│                    MIGRATION SQL                        │
├─────────────────────────────────────────────────────────┤
│ 1. DELETE doublons existants (aucun actuellement)       │
│ 2. ADD CONSTRAINT habits_user_id_title_unique           │
│ 3. CREATE INDEX idx_habits_user_id_title                │
└─────────────────────────────────────────────────────────┘
```

### 2. Vérification finale

Confirmer que :
- La contrainte UNIQUE est bien active
- Le widget affiche `max-h-[350px]` avec scroll
- Les 4 habitudes par défaut se créent correctement

## Résumé technique

| Fichier | Action |
|---------|--------|
| `habits` (table Supabase) | Ajouter contrainte UNIQUE + index |

## Résultat attendu

Une fois la migration exécutée :
- Impossible de créer des doublons au niveau base de données
- Protection double : code + base de données
- Dashboard stable avec widget compact et scrollable
- Synchronisation instantanée Settings ↔ Dashboard

