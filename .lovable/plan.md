
# Plan : Configurer le bucket documents pour accepter text/markdown

## Probleme identifie

Le bucket `documents` rejette les fichiers avec le type MIME `text/markdown`. L'upload echoue avec l'erreur "mime type text/markdown is not supported".

## Solution

Mettre a jour les types MIME autorises du bucket `documents` via une migration SQL.

## Migration SQL

```sql
UPDATE storage.buckets 
SET allowed_mime_types = array_cat(
  COALESCE(allowed_mime_types, ARRAY[]::text[]),
  ARRAY['text/markdown', 'text/plain']
)
WHERE id = 'documents';
```

Cette migration :
- Ajoute `text/markdown` pour les fichiers .md
- Ajoute `text/plain` par securite (certains systemes envoient .md comme text/plain)
- Preserve les types MIME existants du bucket

## Verification prealable

Avant d'executer, je dois verifier la configuration actuelle du bucket :

```sql
SELECT id, name, public, allowed_mime_types, file_size_limit
FROM storage.buckets
WHERE id = 'documents';
```

## Fichier impacte

| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter text/markdown aux types autorises |

## Resultat attendu

- Les fichiers Markdown peuvent etre uploades dans le bucket documents
- Les rapports d'import de roadmap sont sauvegardes correctement
- L'historique des imports affiche les rapports
