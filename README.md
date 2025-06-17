# SentinelIG Harvest

## Présentation

SentinelIG Harvest est un outil Node.js/Bun permettant de collecter des URLs d’articles à partir de flux RSS, puis de les injecter dans une base de données Supabase.  
Le projet est organisé en deux dossiers principaux :

- **WireScout** : injection des flux RSS dans la base (`ListUrlRss`)
- **WireScanner** : récupération des articles à partir des flux et injection dans la base (`articlesUrl`), avec planification automatique (cron)

---

## Prérequis

- [Bun](https://bun.sh) installé (`curl -fsSL https://bun.sh/install | bash`)
- Node.js ≥ 18 (si besoin)
- Un compte [Supabase](https://supabase.com/) et un projet créé
- Accès à la console Supabase pour créer les tables

---

## Installation

Dans chaque dossier (`WireScout` et `WireScanner`) :

```bash
bun install
```

---

## Configuration

1. **Variables d’environnement**

   Crée un fichier `key.env` dans chaque dossier (`WireScout` et `WireScanner`) avec :

   ```dotenv
   SUPABASE_URL=https://<ton-projet>.supabase.co
   SUPABASE_KEY=<ta-clé-supabase>
   ```

   > Récupère ces informations dans Supabase > Project Settings > API.

2. **Création des tables dans Supabase**

   Dans le SQL Editor de Supabase, exécute :

   ```sql
   create table public."ListUrlRss" (
     id serial primary key,
     url text not null unique
   );

   create table public."articlesUrl" (
     id serial primary key,
     url text not null unique
   );
   ```

---

## Utilisation

### 1. Injecter les flux RSS dans la base

Depuis le dossier `WireScout` :

```bash
bun run inject.js
```

- Lis les URLs du fichier [`feedsList.json`](WireScout/feedsList.json)
- Insère les URLs dans la table `ListUrlRss` (sans doublons)

### 2. Récupérer et injecter les articles depuis les flux

Depuis le dossier `WireScanner` :

- Pour lancer une récupération manuelle :

  ```bash
  bun run crawlUrl.js
  ```

- Pour lancer la récupération automatique chaque jour à 03:00 (Europe/Paris) :

  ```bash
  bun run start.js
  ```

  Les logs sont écrits dans `cron-task.log`.

### 3. Tester la connexion Supabase

Depuis `WireScanner` :

```bash
bun run "testSupabase.js 15-40-24-122.js"
```

---

## Structure du projet

```
.
├── WireScout/
│   ├── feedsList.json
│   ├── inject.js
│   ├── key.env
│   ├── package.json
│   └── tsconfig.json
├── WireScanner/
│   ├── crawlUrl.js
│   ├── start.js
│   ├── key.env
│   ├── package.json
│   ├── tsconfig.json
│   ├── cron-task.log
│   └── testSupabase.js 15-40-24-122.js
└── README.md
```

---

## Dépannage

- **Invalid API key** : Vérifie la clé dans `key.env` (copie-la bien depuis Supabase).
- **RLS (Row Level Security) errors** : Ajoute une politique d’insertion dans Supabase si besoin.
- **Problèmes de certificat SSL** : Certains flux peuvent avoir des certificats invalides, voir la doc ou ignorer temporairement les erreurs SSL (déconseillé en production).

---

## Liens utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Bun](https://bun.sh/docs)
- [RSS Parser (npm)](https://www.npmjs.com/package/rss-parser)

---
