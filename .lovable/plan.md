
# Plan : Déployer la migration Soft Delete & History

## Analyse du problème

Les erreurs de build indiquent que la base de données n'a pas les structures attendues par le code :

| Erreur | Cause |
|--------|-------|
| `deleted_at` does not exist on missions | Colonne non créée |
| `mission_history` table not found | Table non créée |
| Type conversion errors | Types TypeScript désynchronisés |

Le fichier `20260127_soft_delete_and_history.sql` existe mais n'a pas été exécuté sur la base de données.

## Migration SQL a deployer

La migration ajoute les elements suivants :

```text
missions table                    tasks table
+-----------------+              +-----------------+
| + deleted_at    |              | + deleted_at    |
| + deleted_by    |              | + deleted_by    |
+-----------------+              +-----------------+
        |
        v
mission_history table (nouvelle)
+---------------------+
| id                  |
| mission_id (FK)     |
| user_id             |
| action              |
| previous_* fields   |
| new_* fields        |
| changed_fields[]    |
| created_at          |
+---------------------+
```

## Actions a realiser

### 1. Executer la migration SQL

Appliquer le contenu du fichier `20260127_soft_delete_and_history.sql` qui contient :

- **Colonnes soft delete** : Ajout de `deleted_at` et `deleted_by` aux tables `missions` et `tasks`
- **Table mission_history** : Creation avec toutes les colonnes pour tracker l'historique
- **Index de performance** : 4 index pour optimiser les requetes
- **Politiques RLS** : Securite pour la table `mission_history`
- **Triggers automatiques** :
  - `track_mission_changes_trigger` : Enregistre automatiquement les modifications
  - `soft_delete_mission_tasks_trigger` : Cascade soft delete missions vers tasks
- **Politiques RLS modifiees** : Exclure les elements supprimes par defaut
- **Fonction de nettoyage** : Suppression definitive apres 30 jours

### 2. Regeneration des types TypeScript

Apres la migration, les types Supabase seront automatiquement regeneres pour inclure :
- `deleted_at` et `deleted_by` sur `missions`
- `deleted_at` et `deleted_by` sur `tasks`
- La table `mission_history` complete

### 3. Verification des hooks

Les hooks existants fonctionneront correctement une fois la migration appliquee :
- `useSoftDeleteMission.ts` : Utilise `deleted_at` et `deleted_by`
- `useMissionHistory.ts` : Interroge la table `mission_history`
- `DeletedMissionsDialog.tsx` : Affiche les missions supprimees

## Resultat attendu

Une fois la migration deployee :
- Suppression douce des missions avec restauration possible pendant 30 jours
- Historique complet des modifications trackees automatiquement
- Cascade soft delete : supprimer une mission supprime aussi ses taches
- Interface corbeille fonctionnelle dans le projet workspace

## Note technique

La migration sera executee via l'outil de migration de base de donnees qui demandera une approbation avant execution.
