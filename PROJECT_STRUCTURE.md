# 📁 Structure du projet SentinelIQ Harvest

```
SentinelIQ Harvest/
├── 📋 Configuration
│   ├── package.json              # Scripts npm et dépendances
│   ├── docker-compose.yml        # Configuration Docker
│   ├── Dockerfile                # Image Docker
│   ├── .gitignore                # Fichiers ignorés par Git
│   └── key.env                   # Variables d'environnement
│
├── 🚀 Applications principales
│   ├── index.js                  # Point d'entrée principal
│   └── process-articles.mjs      # Traitement Cortex principal
│
├── 🕷️ WireScanner/               # Module de collecte RSS
│   ├── start.js                  # Démarrage avec cron automatique
│   ├── crawlUrl.js              # Moteur de crawling optimisé
│   ├── cortexIntegration.js     # Intégration automatique Cortex
│   ├── feedProcessor.js         # Traitement des flux RSS
│   ├── dataManager.js           # Gestion des données
│   ├── performanceManager.js    # Gestion de performance
│   ├── config.js                # Configuration WireScanner
│   ├── rssUtils.js              # Utilitaires RSS
│   ├── utils.js                 # Utilitaires généraux
│   └── migration.js             # Scripts de migration
│
├── 🧠 Cortex/                    # Module de traitement d'articles
│   ├── start.js                 # Point d'entrée Cortex
│   ├── daemon.js                # Mode démon continu
│   ├── scrapArticles.js         # Extraction de contenu
│   ├── contentProcessor.js      # Traitement du contenu
│   ├── platformTester.js        # Tests de plateforme
│   ├── platformInstaller.js     # Installation de plateforme
│   ├── config.js                # Configuration Cortex
│   ├── dataManager.js           # Gestion des données
│   ├── performanceManager.js    # Gestion de performance
│   ├── puppeteerManager.js      # Gestion Puppeteer
│   └── migration.js             # Scripts de migration
│
├── 🗄️ database/                  # Couche base de données
│   ├── client.js                # Client Supabase configuré
│   ├── index.js                 # Point d'entrée database
│   ├── articleRepository.js     # Gestion des articles
│   ├── rssRepository.js         # Gestion des flux RSS
│   └── baseRepository.js        # Repository de base
│
├── 🛠️ utils/                     # Utilitaires système
│   ├── logger.js                # Système de logs avancé
│   └── logManager.js            # Gestionnaire de logs
│
├── 📊 logs/                      # Fichiers de logs
│   ├── system.log               # Logs système
│   ├── scraping.log             # Logs de scraping
│   ├── error.log                # Logs d'erreurs
│   ├── debug.log                # Logs de debug
│   ├── cron.log                 # Logs des tâches cron
│   ├── webhook.log              # Logs webhook (legacy)
│   └── archive/                 # Archives des logs
│
├── 🤖 scripts/                   # Scripts organisés
│   ├── automation/              # Scripts d'automatisation
│   │   ├── auto-integration.mjs          # Pipeline complet
│   │   ├── smart-automation.mjs          # Automatisation intelligente
│   │   ├── monitor-pipeline.mjs          # Surveillance complète
│   │   ├── monitor-simple.mjs            # Monitoring JSON
│   │   └── test-integration-complete.mjs # Tests d'intégration
│   │
│   ├── tests/                   # Scripts de test
│   │   ├── check-*.js           # Scripts de vérification
│   │   ├── test-*.js            # Scripts de test
│   │   ├── test-*.mjs           # Scripts de test modules
│   │   ├── test-*.cjs           # Scripts de test CommonJS
│   │   └── debug-*.js           # Scripts de debug
│   │
│   ├── maintenance/             # Scripts de maintenance
│   │   ├── diagnostic.js                # Diagnostic système
│   │   ├── manage-rss-feeds.js          # Gestion flux RSS
│   │   ├── fix-database-schema.js       # Réparation schéma
│   │   └── add-unique-constraint.mjs    # Contraintes DB
│   │
│   └── legacy/                  # Anciens scripts (compatibilité)
│       ├── run-scrapping.js             # Ancien scrapping
│       ├── manual-trigger.js            # Déclenchement manuel
│       ├── trigger-scrapping.sh         # Script shell legacy
│       ├── simple-test.cjs              # Test simple legacy
│       ├── healthcheck.sh               # Healthcheck legacy
│       ├── cortex-batch-*.mjs           # Anciens batch Cortex
│       └── process-articles-*.mjs       # Anciennes versions
│
└── 📚 docs/                      # Documentation
    ├── DOCKER_DEPLOY.md          # Guide déploiement Docker
    ├── SECURITY.md               # Documentation sécurité
    └── MANUAL_TRIGGER_README.md  # Guide déclenchement manuel
```

## 🎯 **Points d'entrée principaux**

### 🚀 **Production**

- `npm start` → `index.js` (Application principale)
- `npm run auto-harvest` → `scripts/automation/auto-integration.mjs`
- `npm run smart-automation` → `scripts/automation/smart-automation.mjs`

### 🔧 **Développement**

- `npm run dev` → `index.js` (mode watch)
- `npm run test-integration` → `scripts/automation/test-integration-complete.mjs`
- `npm run monitor` → `scripts/automation/monitor-pipeline.mjs`

### 📊 **Maintenance**

- `npm run diagnostic` → `scripts/maintenance/diagnostic.js`
- `npm run db:health` → Commande inline base de données
- `npm run rss:stats` → `scripts/maintenance/manage-rss-feeds.js`

## 🧹 **Nettoyage effectué**

### ✅ **Fichiers organisés**

- Scripts d'automatisation → `scripts/automation/`
- Scripts de test → `scripts/tests/`
- Scripts de maintenance → `scripts/maintenance/`
- Anciens scripts → `scripts/legacy/`
- Documentation → `docs/`

### 🗑️ **Fichiers supprimés**

- `scrap.log` (log obsolète)
- `quick-schema-check.js` (redondant)
- `full-schema-check.js` (remplacé)
- `index-optimized.js` (non utilisé)

### 🔄 **Scripts mis à jour**

- Tous les chemins dans `package.json` corrigés
- Structure cohérente et navigable
- Séparation claire production/développement/legacy

Cette organisation améliore :

- 📁 **Lisibilité** du projet
- 🔍 **Facilité de navigation**
- 🛠️ **Maintenance** simplifiée
- 🎯 **Séparation des responsabilités**
