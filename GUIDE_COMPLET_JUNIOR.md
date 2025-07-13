# 🎓 **Guide Complet SentinelIQ Harvest v2.0**

_Guide pour développeurs débutants et intermédiaires_

---

## 📚 **Table des Matières**

1. [🎯 Vue d'ensemble](#overview)
2. [🏗️ Architecture du système](#architecture)
3. [🚀 Installation et démarrage](#installation)
4. [📖 Comprendre WireScanner](#wirescanner)
5. [🧠 Comprendre Cortex](#cortex)
6. [💾 Système de base de données](#database)
7. [📋 Logs et monitoring](#logs)
8. [🔧 Scripts NPM disponibles](#scripts)
9. [🛠️ Migration et compatibilité](#migration)
10. [💡 Conseils pour développeurs](#tips)
11. [🐛 Dépannage](#troubleshooting)

---

## 🎯 **Vue d'ensemble** {#overview}

### **Qu'est-ce que SentinelIQ Harvest ?**

SentinelIQ Harvest est un système automatisé de **collecte et d'analyse d'articles** qui fonctionne en deux étapes principales :

1. **🕷️ WireScanner** : Collecte les liens d'articles depuis des flux RSS
2. **🧠 Cortex** : Analyse le contenu des articles collectés

### **Problème résolu**

- ❌ **Avant** : Surveillance manuelle des sites web, perte d'informations importantes
- ✅ **Après** : Collecte automatisée 24/7, analyse intelligente du contenu

### **Technologies utilisées**

- **Runtime** : Node.js (migré depuis Bun)
- **Base de données** : Supabase (PostgreSQL)
- **Scraping** : Puppeteer pour l'analyse des pages web
- **Parsing RSS** : xml2js pour traiter les flux RSS
- **Process management** : Modules Node.js natifs

---

## 🏗️ **Architecture du système** {#architecture}

### **Vue d'ensemble de l'architecture**

```
📁 SentinelIQ Harvest/
├── 🕷️ WireScanner/          # Module de collecte RSS
├── 🧠 Cortex/               # Module d'analyse de contenu
├── 💾 database/             # Couche d'accès aux données
├── 🛠️ utils/               # Utilitaires (logs, etc.)
├── 📋 logs/                # Fichiers de logs
├── 📄 *.md                 # Documentation
└── 📦 package.json         # Configuration NPM
```

### **Flux de données**

```
1. 🌐 Sites RSS → 2. 🕷️ WireScanner → 3. 💾 Base de données (URLs)
                                          ↓
6. 📊 Rapport final ← 5. 💾 Base de données (Articles) ← 4. 🧠 Cortex
```

### **Cycle de vie d'un article**

1. **Découverte** : WireScanner trouve un lien dans un flux RSS
2. **Stockage URL** : Le lien est sauvegardé dans `articlesUrl`
3. **Analyse** : Cortex récupère le contenu de la page
4. **Traitement** : Le contenu est nettoyé et analysé
5. **Stockage final** : L'article complet est sauvé dans `articles`

---

## 🚀 **Installation et démarrage** {#installation}

### **Prérequis**

```bash
# Vérifier Node.js (version 16+ recommandée)
node --version

# Vérifier npm
npm --version
```

### **Installation**

```bash
# 1. Cloner le projet
git clone [votre-repo]
cd "SentinelIQ Harvest"

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp key.env.example key.env
# Éditer key.env avec vos credentials Supabase
```

### **Configuration key.env**

```bash
# Base de données Supabase
SUPABASE_URL=https://votre-project.supabase.co
SUPABASE_KEY=votre-clé-api

# Logs (optionnel)
DEBUG=true
VERBOSE=true

# Cortex (optionnel)
CORTEX_PORT=3001
CORTEX_LOG_LEVEL=INFO
```

### **Premier démarrage**

```bash
# Test de la configuration
npm run diagnostic

# Test de la base de données
npm run db:test

# Lancement d'un test de scrapping
npm run scrapping
```

---

## 📖 **Comprendre WireScanner** {#wirescanner}

### **Rôle de WireScanner**

WireScanner est le **collecteur RSS** du système. Il :

- 📡 Surveille les flux RSS configurés
- 🔍 Extrait les liens d'articles
- 💾 Sauvegarde les URLs dans la base de données
- 🚀 Lance automatiquement Cortex ensuite

### **Architecture WireScanner v2.0**

```
WireScanner/
├── 📋 config.js             # Configuration centralisée
├── 📊 performanceManager.js # Monitoring des performances
├── 🔄 feedProcessor.js      # Traitement des flux RSS
├── 💾 dataManager.js        # Gestion base de données
├── 🛠️ utils.js             # Utilitaires réutilisables
├── 🚀 crawlUrl.optimized.js # Module principal v2.0
├── 🔄 migration.js          # Outils de migration
└── 🎯 start.js             # Point d'entrée
```

### **Optimisations v2.0**

#### **🧠 Gestion mémoire**

```javascript
// Garbage collection automatique
setInterval(() => {
  if (global.gc && memoryUsage > threshold) {
    global.gc();
  }
}, 60000);

// Cache intelligent avec TTL
const cache = new Map();
// Auto-nettoyage après 5 minutes
```

#### **⚡ Traitement concurrent**

```javascript
// Limite la charge système
const CONCURRENT_FEEDS = 5; // 5 flux max simultanés
const CONCURRENT_ARTICLES = 10; // 10 articles max simultanés

// Batching pour la base de données
const BATCH_SIZE = 50; // 50 articles par lot
```

#### **📊 Monitoring en temps réel**

```javascript
// Surveillance automatique
const monitor = {
  memoryUsage: process.memoryUsage(),
  feedsProcessed: 0,
  articlesFound: 0,
  errorRate: 0,
};
```

### **Comment utiliser WireScanner**

#### **Utilisation basique**

```bash
# Scrapping automatique (configuré en cron)
npm run wire-scanner

# Scrapping manuel
npm run scrapping
```

#### **Utilisation avancée**

```javascript
import { startWireScanner } from "./WireScanner/start.js";

// Configuration personnalisée
const options = {
  maxFeeds: 10,
  enableCortex: true,
  logLevel: "DEBUG",
};

const results = await startWireScanner(options);
console.log(`${results.articlesFound} articles trouvés`);
```

### **Monitoring WireScanner**

```bash
# Voir les statistiques
npm run diagnostic

# Analyser les logs WireScanner
grep "WireScanner" logs/scraping.log | tail -50

# Voir l'utilisation mémoire
node -e "console.log(process.memoryUsage())"
```

---

## 🧠 **Comprendre Cortex** {#cortex}

### **Rôle de Cortex**

Cortex est le **cerveau analytique** du système. Il :

- 🔍 Analyse le contenu des pages web
- 📝 Extrait le texte principal des articles
- 🧹 Nettoie et structure le contenu
- 💾 Sauvegarde les articles traités

### **Architecture Cortex v2.0**

```
Cortex/
├── ⚙️ config.js              # Configuration Puppeteer et performance
├── 📊 performanceManager.js   # Monitoring spécialisé Puppeteer
├── 🕷️ scrapingEngine.js      # Pool de browsers et scraping
├── 💾 dataManager.js          # Gestion données avec cache
├── 🔍 contentProcessor.js     # Traitement intelligent du contenu
├── 🚀 cortexOptimized.js      # Orchestrateur principal v2.0
├── 🔄 migration.js           # Migration et compatibilité
└── 🎯 start.js              # Point d'entrée dual
```

### **Optimisations v2.0**

#### **🌐 Pool de browsers Puppeteer**

```javascript
// Réutilisation des instances browser
class BrowserPool {
  constructor(poolSize = 2) {
    this.browsers = [];
    this.available = [];
    this.busy = [];
  }

  async getBrowser() {
    // Récupère un browser disponible ou en crée un nouveau
  }

  releaseBrowser(browser) {
    // Remet le browser dans le pool
  }
}
```

#### **🧠 Gestion mémoire Puppeteer**

```javascript
// Configuration optimisée pour Puppeteer
const browserOptions = {
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-images", // Économise de la mémoire
    "--disable-javascript", // Optionnel selon le site
  ],
};

// Nettoyage automatique des pages
page.on("response", () => {
  if (responseCount > 50) {
    page.close(); // Ferme la page si trop de ressources
  }
});
```

#### **📊 Traitement concurrent intelligent**

```javascript
// Limite adaptative selon les ressources
const getOptimalConcurrency = () => {
  const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;

  if (memUsage > 200) return 1; // Mode économie
  if (memUsage > 100) return 2; // Mode normal
  return 3; // Mode performance
};
```

### **Comment utiliser Cortex**

#### **Utilisation basique**

```bash
# Analyse automatique (lancé après WireScanner)
npm run cortex

# Analyse manuelle
node Cortex/start.js
```

#### **Utilisation avancée**

```javascript
import { startCortex } from "./Cortex/start.js";

// Configuration personnalisée
const options = {
  maxArticles: 50,
  enableMonitoring: true,
  enableBatching: true,
  useOptimized: true, // Utilise la version v2.0
};

const results = await startCortex(options);
console.log(`${results.results.articlesScraped} articles analysés`);
```

#### **Migration vers v2.0**

```javascript
import { migrateCortex } from "./Cortex/start.js";

// Migration automatique
const migrationResults = await migrateCortex({
  createBackup: true,
  testNewVersion: true,
});

if (migrationResults.success) {
  console.log("Migration v2.0 réussie !");
}
```

### **Monitoring Cortex**

```bash
# Statut de Cortex
node -e "
import('./Cortex/start.js').then(m => {
    console.log(JSON.stringify(m.getCortexStatus(), null, 2));
});
"

# Voir les logs Cortex
tail -f logs/scraping.log | grep "Cortex"

# Analyser les performances
npm run diagnostic | grep -A 10 "Cortex"
```

---

## 💾 **Système de base de données** {#database}

### **Architecture de la couche database/**

La couche `database/` centralise **tous les accès** à Supabase avec une architecture moderne :

```
database/
├── 🔌 client.js           # Client Supabase singleton
├── 📝 baseRepository.js   # Classe CRUD de base
├── 📡 rssRepository.js    # Repository flux RSS
├── 📄 articleRepository.js # Repositories articles
└── 🎯 index.js           # Point d'entrée + compatibilité
```

### **Tables de la base de données**

#### **1. `ListUrlRss` - Flux RSS surveillés**

```sql
CREATE TABLE ListUrlRss (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,       -- URL du flux RSS
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **2. `articlesUrl` - URLs d'articles découverts**

```sql
CREATE TABLE articlesUrl (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,       -- URL de l'article
    titre TEXT,                     -- Titre depuis le RSS
    description TEXT,               -- Description depuis le RSS
    datePublication TIMESTAMP,      -- Date de publication
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### **3. `articles` - Articles analysés**

```sql
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    urlArticle TEXT UNIQUE NOT NULL, -- URL de l'article
    title TEXT NOT NULL,            -- Titre extrait
    content TEXT NOT NULL,          -- Contenu complet
    dateRecuperation TIMESTAMP,     -- Date d'analyse
    datePublication TIMESTAMP,      -- Date de publication
    source TEXT,                    -- Source (WireScanner/Cortex)
    metadata JSONB                  -- Métadonnées additionnelles
);
```

### **Utilisation des repositories**

#### **Repository RSS**

```javascript
import { rssRepository } from "./database/index.js";

// Récupérer tous les flux RSS actifs
const feeds = await rssRepository.getAllFeeds();
console.log(`${feeds.length} flux RSS configurés`);

// Ajouter un nouveau flux
await rssRepository.addFeed({
  url_rss: "https://example.com/rss.xml",
});

// Vérifier qu'un flux existe
const exists = await rssRepository.findByUrl("https://example.com/rss.xml");
```

#### **Repository ArticlesUrl**

```javascript
import { articleUrlRepository } from "./database/index.js";

// Récupérer les articles non traités
const unprocessed = await articleUrlRepository.findAll({
  limit: 100,
  orderBy: { created_at: "DESC" },
});

// Ajouter un nouvel article découvert
await articleUrlRepository.addArticle({
  url: "https://example.com/article-1",
  titre: "Titre de l'article",
  description: "Description courte",
  datePublication: new Date().toISOString(),
});

// Vérifier qu'un article existe déjà
const exists = await articleUrlRepository.existsByUrl(articleUrl);
```

#### **Repository Articles (traités)**

```javascript
import { articleRepository } from "./database/index.js";

// Sauvegarder un article analysé
await articleRepository.saveProcessedArticle({
  urlArticle: "https://example.com/article-1",
  title: "Titre extrait de la page",
  content: "Contenu complet de l'article...",
  datePublication: "2025-01-15T10:30:00Z",
  source: "Cortex",
  metadata: {
    author: "John Doe",
    wordCount: 1500,
    extractedAt: new Date().toISOString(),
  },
});

// Vérifier qu'un article a été traité
const isProcessed = await articleRepository.exists({
  urlArticle: articleUrl,
});

// Récupérer les statistiques
const stats = await articleRepository.getStats();
console.log(`${stats.total} articles traités`);
```

### **Compatibilité avec l'ancien code**

La nouvelle couche maintient la **compatibilité** avec l'ancien code :

```javascript
// ⚠️ Ancien code (encore fonctionnel mais deprecated)
import { getRssFeeds } from "./WireScanner/supabaseUtils.js";
// → Affiche un warning de migration

// ✅ Nouveau code (recommandé)
import { rssRepository } from "./database/index.js";
```

### **Outils de diagnostic database**

```bash
# Test de connexion simple
npm run db:test

# Santé complète du système
npm run db:health

# Statistiques globales
npm run db:stats

# Analyse des schémas
npm run db:schema

# Test de compatibilité ancien/nouveau
npm run db:compatibility
```

---

## 📋 **Logs et monitoring** {#logs}

### **Structure des logs**

```
logs/
├── 📊 system.log     # Logs système généraux
├── 🕷️ scraping.log  # Logs WireScanner + Cortex
├── 🐛 error.log     # Erreurs uniquement
├── 🔍 debug.log     # Logs de débogage détaillés
├── 🌐 webhook.log   # Logs webhooks (deprecated)
└── ⏰ cron.log      # Logs des tâches cron
```

### **Niveaux de logging**

1. **ERROR** : Erreurs critiques uniquement
2. **WARN** : Avertissements importants
3. **INFO** : Informations générales (défaut)
4. **DEBUG** : Détails techniques pour le débogage

### **Configuration des logs**

```javascript
// Dans key.env
DEBUG=true              # Active les logs debug
VERBOSE=true           # Logs très détaillés
CORTEX_LOG_LEVEL=INFO  # Niveau pour Cortex spécifiquement
```

### **Utilisation du système de logs**

```javascript
import { logger } from "./utils/logger.js";

// Logs basiques
logger.info("Démarrage du traitement", "MonModule");
logger.warning("Ressource faible", "MonModule");
logger.error("Erreur critique", "MonModule");

// Logs avec données
logger.debug("Résultats traitement", "MonModule", {
  articlesFound: 25,
  processingTime: 1500,
  memoryUsage: "150MB",
});
```

### **Scripts d'analyse des logs**

```bash
# Analyse complète des logs
npm run logs:analyze

# Résumé des logs récents
npm run logs:summary

# Nettoyage des anciens logs
npm run logs:clean

# Voir les erreurs récentes uniquement
tail -50 logs/error.log

# Suivre les logs en temps réel
tail -f logs/scraping.log
```

### **Monitoring des performances**

#### **Métriques WireScanner**

```bash
# Voir les statistiques RSS
grep "feedsProcessed" logs/scraping.log | tail -10

# Analyser les temps de traitement
grep "session terminée" logs/scraping.log | tail -5
```

#### **Métriques Cortex**

```bash
# Voir les articles analysés
grep "articles traités" logs/scraping.log | tail -10

# Analyser l'utilisation mémoire
grep "Mémoire" logs/debug.log | tail -10
```

#### **Alertes automatiques**

Le système génère automatiquement des alertes pour :

- 🔥 Utilisation mémoire > 80%
- ⏰ Traitement > 30 minutes
- ❌ Taux d'erreur > 10%
- 💾 Espace disque faible

---

## 🔧 **Scripts NPM disponibles** {#scripts}

### **Scripts principaux**

```bash
# 🚀 Démarrage
npm start                    # Démarrage complet du système
npm run dev                  # Mode développement avec rechargement

# 🕷️ WireScanner
npm run wire-scanner         # WireScanner automatique (cron)
npm run scrapping           # WireScanner manuel

# 🧠 Cortex
npm run cortex              # Cortex automatique
```

### **Scripts de base de données**

```bash
# 🧪 Tests
npm run db:test             # Test de connexion simple
npm run db:test-full        # Test complet avec toutes les tables
npm run db:health           # État de santé détaillé

# 📊 Informations
npm run db:stats            # Statistiques globales
npm run db:schema           # Structure des tables
npm run db:compatibility    # Test compatibilité ancien/nouveau code
```

### **Scripts de logs et diagnostic**

```bash
# 📋 Logs
npm run logs:analyze        # Analyse complète des logs
npm run logs:summary        # Résumé des logs récents
npm run logs:clean          # Nettoyage des anciens logs

# 🔍 Diagnostic
npm run diagnostic          # Diagnostic complet du système
npm run diagnostic:quick    # Diagnostic rapide
```

### **Scripts de développement**

```bash
# 🛠️ Développement
npm run lint                # Vérification du code
npm run format              # Formatage automatique
npm run test                # Tests unitaires (si configurés)

# 🔄 Migration
npm run migrate:database    # Migration vers nouvelle couche database/
npm run migrate:cortex      # Migration Cortex vers v2.0
```

### **Scripts utilitaires**

```bash
# 🧹 Maintenance
npm run cleanup             # Nettoyage général
npm run reset               # Reset complet (attention !)
npm run backup              # Sauvegarde de configuration

# 📊 Monitoring
npm run status              # Statut du système
npm run metrics             # Métriques de performance
npm run health-check        # Vérification santé
```

---

## 🛠️ **Migration et compatibilité** {#migration}

### **Migration de Bun vers Node.js**

Le projet a été **entièrement migré** de Bun vers Node.js pour une meilleure compatibilité :

#### **Changements effectués**

- ✅ `index.ts` → `index.js`
- ✅ Configuration `package.json` mise à jour
- ✅ Scripts npm complets
- ✅ Suppression des dépendances Bun
- ✅ Documentation mise à jour

#### **Si vous venez d'une ancienne version**

```bash
# 1. Sauvegarder l'ancienne configuration
cp key.env key.env.backup

# 2. Nettoyer les anciennes dépendances
rm -rf node_modules package-lock.json

# 3. Réinstaller avec npm
npm install

# 4. Tester la configuration
npm run diagnostic
```

### **Migration de la couche database**

#### **Détection automatique de l'ancien code**

Le système détecte automatiquement l'utilisation de l'ancienne API et affiche des warnings :

```
⚠️ [MIGRATION] supabaseUtils.js est deprecated
   → Utilisez: import { rssRepository } from '../database/index.js'
   → Guide: DATABASE_MIGRATION_GUIDE.md
```

#### **Migration pas à pas**

**Étape 1 : Identifier les fichiers à migrer**

```bash
# Trouver les anciens imports
grep -r "supabaseUtils" . --include="*.js"
```

**Étape 2 : Remplacer les imports**

```javascript
// ❌ Ancien
import { getRssFeeds } from "./supabaseUtils.js";

// ✅ Nouveau
import { rssRepository } from "../database/index.js";
```

**Étape 3 : Adapter les appels de fonction**

```javascript
// ❌ Ancien
const feeds = await getRssFeeds();

// ✅ Nouveau
const feeds = await rssRepository.getAllFeeds();
```

**Étape 4 : Tester**

```bash
npm run db:compatibility
```

### **Migration Cortex vers v2.0**

#### **Migration automatique**

```javascript
import { migrateCortex } from "./Cortex/start.js";

const migrationResults = await migrateCortex({
  createBackup: true, // Sauvegarde avant migration
  testNewVersion: true, // Test de la v2.0
  preserveOldFiles: true, // Garde les anciens fichiers
});
```

#### **Migration manuelle**

```bash
# 1. Vérifier la compatibilité
node -e "
import('./Cortex/migration.js').then(m => {
    m.cortexMigration.generateCompatibilityReport().then(console.log);
});
"

# 2. Lancer la migration si compatible
node -e "
import('./Cortex/start.js').then(m => {
    m.migrateCortex().then(console.log);
});
"
```

### **Migration WireScanner vers v2.0**

WireScanner v2.0 est **rétrocompatible**. L'ancien et le nouveau code coexistent :

```
WireScanner/
├── 📜 crawlUrl.js           # Version originale (fonctionnelle)
├── 🚀 crawlUrl.optimized.js # Version v2.0 (optimisée)
├── 📜 supabaseUtils.js      # Ancien (avec warnings)
├── 🆕 dataManager.js        # Nouveau (recommandé)
└── ... (autres modules v2.0)
```

**Utilisation**

```javascript
// Utilise automatiquement la v2.0 si disponible
import { startWireScanner } from "./WireScanner/start.js";

// Force l'utilisation de la v1.0 (legacy)
import { crawlUrl as crawlUrlLegacy } from "./WireScanner/crawlUrl.js";
```

---

## 💡 **Conseils pour développeurs** {#tips}

### **🎯 Bonnes pratiques générales**

#### **1. Toujours utiliser les nouvelles APIs**

```javascript
// ✅ Bon - Utilise la nouvelle couche database
import { articleRepository } from "./database/index.js";

// ❌ Éviter - Ancien code deprecated
import { getUrlArticle } from "./Cortex/supabaseUtils.js";
```

#### **2. Gérer les erreurs correctement**

```javascript
try {
  const results = await scrapingFunction();
  logger.info(`Succès: ${results.length} éléments traités`);
} catch (error) {
  logger.error(`Erreur scraping: ${error.message}`);
  // Gérer l'erreur (retry, alerte, etc.)
}
```

#### **3. Utiliser le système de logs**

```javascript
import { logger } from "./utils/logger.js";

// Toujours spécifier le module
logger.info("Démarrage traitement", "MonModule");

// Inclure des données contextuelles
logger.debug("Résultats", "MonModule", {
  count: results.length,
  duration: Date.now() - startTime,
});
```

#### **4. Surveiller les performances**

```javascript
// Mesurer les temps de traitement
const startTime = Date.now();
await processFunction();
const duration = Date.now() - startTime;

if (duration > 30000) {
  // Plus de 30 secondes
  logger.warning(`Traitement lent: ${duration}ms`, "MonModule");
}
```

### **🔧 Développement et débogage**

#### **1. Activer les logs détaillés**

```bash
# Dans key.env
DEBUG=true
VERBOSE=true
CORTEX_LOG_LEVEL=DEBUG
```

#### **2. Tester en isolation**

```javascript
// Tester WireScanner seul
npm run scrapping

// Tester Cortex seul
npm run cortex

// Tester un module spécifique
node -e "import('./WireScanner/feedProcessor.js').then(m => m.processFeed('https://example.com/rss'))"
```

#### **3. Utiliser les outils de diagnostic**

```bash
# Diagnostic rapide
npm run diagnostic

# Focus sur un composant
npm run db:health      # Base de données
npm run logs:analyze   # Logs
```

#### **4. Surveiller la mémoire en développement**

```javascript
// Ajouter des checkpoints mémoire
const checkMemory = () => {
  const usage = process.memoryUsage();
  console.log(`Mémoire: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
};

// Surveiller avant/après les opérations coûteuses
checkMemory(); // avant
await heavyProcessingFunction();
checkMemory(); // après
```

### **⚡ Optimisations de performance**

#### **1. Configurer la concurrence selon votre système**

```javascript
// Dans WireScanner/config.js ou Cortex/config.js
export const PERFORMANCE_CONFIG = {
  // Système puissant
  MAX_CONCURRENT_ARTICLES: 5,
  BROWSER_POOL_SIZE: 3,

  // Système modeste
  MAX_CONCURRENT_ARTICLES: 2,
  BROWSER_POOL_SIZE: 1,
};
```

#### **2. Adapter les timeouts**

```javascript
// Pour sites lents
PAGE_TIMEOUT: 60000,  // 60 secondes

// Pour sites rapides
PAGE_TIMEOUT: 15000,  // 15 secondes
```

#### **3. Gérer le cache intelligemment**

```javascript
// Cache agressif pour développement
ARTICLE_CACHE_TTL: 3600000,  // 1 heure

// Cache conservateur pour production
ARTICLE_CACHE_TTL: 300000,   // 5 minutes
```

### **🔒 Sécurité et robustesse**

#### **1. Valider toutes les entrées**

```javascript
const validateUrl = (url) => {
  if (!url || typeof url !== "string") {
    throw new Error("URL invalide");
  }

  if (!url.startsWith("http")) {
    throw new Error("URL doit commencer par http/https");
  }

  return true;
};
```

#### **2. Gérer les timeouts**

```javascript
const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    ),
  ]);
};

// Utilisation
await withTimeout(scrapingFunction(), 30000); // 30s max
```

#### **3. Implémenter des retry intelligents**

```javascript
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = Math.pow(2, i) * 1000; // Backoff exponentiel
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};
```

---

## 🐛 **Dépannage** {#troubleshooting}

### **❌ Problèmes fréquents et solutions**

#### **1. Erreurs de connexion base de données**

**Symptôme**

```
❌ Erreur connexion DB: Invalid API key
```

**Solution**

```bash
# 1. Vérifier la configuration
cat key.env | grep SUPABASE

# 2. Tester la connexion
npm run db:test

# 3. Vérifier les credentials sur Supabase
# → Settings → API → anon/service_role keys
```

#### **2. Erreurs mémoire Puppeteer**

**Symptôme**

```
❌ Error: Navigation timeout exceeded
❌ Error: Protocol error: Target closed
```

**Solution**

```javascript
// Dans Cortex/config.js - Réduire la charge
export const PERFORMANCE_CONFIG = {
  MAX_CONCURRENT_BROWSERS: 1, // Au lieu de 2
  MAX_CONCURRENT_ARTICLES: 1, // Au lieu de 3
  PAGE_TIMEOUT: 60000, // Augmenter timeout
};
```

#### **3. Erreurs de parsing RSS**

**Symptôme**

```
❌ Erreur parsing RSS: Invalid XML
```

**Solution**

```bash
# 1. Tester le flux RSS manuellement
curl -s "https://site.com/rss.xml" | head -20

# 2. Vérifier les logs
grep "RSS parsing" logs/scraping.log | tail -10

# 3. Utiliser un validateur RSS
# → https://validator.w3.org/feed/
```

#### **4. Process bloqué**

**Symptôme**

```
⚠️ Process bloqué depuis > 30 minutes
```

**Solution**

```bash
# 1. Identifier le process
ps aux | grep node

# 2. Arrêter proprement
npm run stop
# ou forcer
pkill -f "node.*SentinelIQ"

# 3. Redémarrer
npm run diagnostic
npm run scrapping
```

### **🔍 Outils de diagnostic**

#### **1. Diagnostic complet**

```bash
npm run diagnostic
```

**Ce que ça vérifie :**

- ✅ Configuration `key.env`
- ✅ Connexion base de données
- ✅ État des tables
- ✅ Espace disque disponible
- ✅ Mémoire système
- ✅ Logs récents

#### **2. Diagnostic spécialisé**

```bash
# Focus base de données
npm run db:health

# Focus logs
npm run logs:analyze

# Focus mémoire
node -e "console.log(process.memoryUsage())"

# Focus disque
df -h .
```

#### **3. Tests isolés**

```bash
# Tester un flux RSS spécifique
node -e "
import('./WireScanner/feedProcessor.js').then(m => {
    m.feedProcessor.processFeed('https://feeds.example.com/rss.xml')
        .then(console.log)
        .catch(console.error);
});
"

# Tester l'analyse d'un article
node -e "
import('./Cortex/scrapingEngine.js').then(m => {
    m.scrapingEngine.scrapeArticle('https://example.com/article')
        .then(console.log)
        .catch(console.error);
});
"
```

### **📞 Obtenir de l'aide**

#### **1. Informations à collecter**

Avant de demander de l'aide, collectez :

```bash
# Version Node.js
node --version

# Logs récents
tail -50 logs/error.log > debug-logs.txt

# Configuration (sans secrets)
cat key.env | grep -v KEY | grep -v PASSWORD

# Diagnostic complet
npm run diagnostic > diagnostic-report.txt

# État du système
free -h && df -h
```

#### **2. Logs utiles à partager**

```bash
# Erreurs récentes uniquement
grep "ERROR\|❌" logs/*.log | tail -20

# Dernière session de scrapping
grep -A 10 -B 5 "session.*terminée" logs/scraping.log | tail -30

# Statistiques de performance
grep "Mémoire\|Memory\|Performance" logs/debug.log | tail -10
```

#### **3. Tests reproductibles**

```bash
# Commande minimale pour reproduire le problème
npm run scrapping 2>&1 | tee test-output.txt

# Test en mode debug
DEBUG=true VERBOSE=true npm run scrapping
```

---

## 🎓 **Conclusion**

### **Ce que vous avez appris**

- 🏗️ **Architecture modulaire** : WireScanner + Cortex + Database
- ⚡ **Optimisations v2.0** : Performance, mémoire, concurrence
- 💾 **Couche database** : Repositories, compatibilité, migration
- 📊 **Monitoring** : Logs, métriques, diagnostic
- 🔧 **Scripts NPM** : Automatisation, maintenance, tests
- 🛠️ **Dépannage** : Problèmes fréquents et solutions

### **Prochaines étapes recommandées**

1. **Commencer petit** : Testez d'abord `npm run diagnostic`
2. **Expérimenter** : Lancez `npm run scrapping` avec quelques flux
3. **Optimiser** : Ajustez les configurations selon votre système
4. **Surveiller** : Analysez les logs avec `npm run logs:analyze`
5. **Migrer progressivement** : Passez à la v2.0 de vos modules

### **Ressources supplémentaires**

- **Documentation officielle** : README.md pour les bases
- **Guides spécialisés** : DATABASE_MIGRATION_GUIDE.md, CHANGELOG.md
- **Scripts d'aide** : `npm run` pour voir tous les scripts disponibles
- **Logs en temps réel** : `tail -f logs/scraping.log`

**🚀 Bon développement avec SentinelIQ Harvest !**
