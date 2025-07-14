# 🎯 SentinelIQ Harvest

**Système intelligent de collecte et d'analyse d'articles RSS avec pipeline automatisé**

SentinelIQ Harvest est une solution complète pour la collecte, le traitement et l'analyse automatique d'articles provenant de flux RSS. Le système intègre un pipeline WireScanner → Cortex → Base de données entièrement automatisé avec surveillance intelligente.

## 🌟 **Fonctionnalités principales**

- **🔄 Pipeline automatisé** : WireScanner → Cortex → Base de données
- **🤖 Automatisation intelligente** : Analyse l'état et prend des décisions optimales
- **📊 Surveillance en temps réel** : Monitoring complet avec alertes
- **🌐 Serveur healthcheck** : Intégration native pour Coolify/Docker
- **📈 Métriques avancées** : Statistiques détaillées et analyse de performance
- **🔧 Gestion des erreurs** : Système robuste avec retry automatique
- **📝 Logging complet** : Traçabilité complète de toutes les opérations

## 🌐 **Serveur Healthcheck intégré**

Le système démarre automatiquement un serveur web de healthcheck pour Coolify :

- **Port** : `3000` (configurable via `HEALTH_PORT`)
- **Endpoints** :
  - `GET /health` - État général du système avec métriques complètes
  - `GET /ready` - Vérification de disponibilité des services (pour readiness probes)
  - `GET /metrics` - Métriques système au format JSON
- **Statuts** :
  - `200` : Système fonctionnel
  - `503` : Services non prêts (endpoint `/ready`)
  - `404` : Endpoint non trouvé

### Configuration Coolify

```bash
# Variables d'environnement
HEALTH_PORT=3000

# Health check URL
http://localhost:3000/health
```

## 🚀 **Scripts disponibles**

### 🌾 **Collecte et traitement (Harvest)**

```bash
# Pipeline complet automatique (recommandé)
npm run harvest              # WireScanner → Cortex → Base complète

# Automatisation intelligente (analyse et décide)
npm run harvest:auto         # Analyse l'état et exécute l'action optimale

# Actions spécifiques
npm run harvest:collect      # Collecte RSS uniquement (WireScanner)
npm run harvest:process      # Traitement des articles en attente (Cortex)
npm run harvest:test         # Test d'intégration complet
```

### 📊 **Surveillance et monitoring**

```bash
# État du système
npm run status               # État complet en temps réel
npm run status:watch         # Surveillance continue (5 min)
npm run status:json          # Sortie JSON pour automatisation

# Santé système
npm run health               # Santé de la base de données
npm run stats                # Statistiques globales complètes
```

### � **Maintenance et diagnostic**

```bash
# Diagnostic système
npm run diagnostic           # Diagnostic complet du système

# Gestion des logs
npm run logs:summary         # Résumé des logs récents
npm run logs:clean           # Nettoyage des anciens logs

# Gestion RSS
npm run rss:list             # Liste tous les flux RSS
npm run rss:stats            # Statistiques détaillées des flux
```

### 🛠️ **Développement et démarrage**

```bash
# Démarrage
npm start                    # Démarrage standard avec serveur healthcheck
npm run dev                  # Mode développement avec watch

# Scripts de test et legacy (usage avancé uniquement)
npm run _test:db             # Test de connexion base
npm run _test:schema         # Test du schéma
npm run _test:rss            # Test des flux RSS
npm run _legacy:wire-scanner # Ancien WireScanner avec cron
npm run _legacy:cortex       # Ancien Cortex standalone
```

## 🔧 **Architecture détaillée**

```
SentinelIQ Harvest/
├── 🕷️ WireScanner/                # Module de collecte RSS
│   ├── start.js                   # Démarrage avec cron automatique
│   ├── crawlUrl.js               # Moteur de crawling optimisé
│   ├── cortexIntegration.js      # Intégration automatique Cortex
│   ├── feedProcessor.js          # Traitement des flux RSS
│   ├── dataManager.js            # Gestion des données
│   └── performanceManager.js     # Gestion de performance
│
├── 🧠 Cortex/                     # Module de traitement d'articles
│   ├── start.js                  # Point d'entrée Cortex
│   ├── daemon.js                 # Mode démon continu
│   ├── scrapArticles.js          # Extraction de contenu
│   ├── contentProcessor.js       # Traitement du contenu
│   └── platformTester.js         # Tests de plateforme
│
├── 🗄️ database/                   # Couche base de données
│   ├── client.js                 # Client Supabase configuré
│   ├── articleRepository.js      # Gestion des articles
│   ├── rssRepository.js          # Gestion des flux RSS
│   └── baseRepository.js         # Repository de base
│
├── 🛠️ utils/                      # Utilitaires système
│   ├── logger.js                 # Système de logs avancé
│   └── logManager.js             # Gestionnaire de logs
│
├── 📊 logs/                       # Fichiers de logs
│   ├── system.log                # Logs système
│   ├── scraping.log              # Logs de scraping
│   ├── error.log                 # Logs d'erreurs
│   └── archive/                  # Archives des logs
│
├── 🤖 scripts/                    # Scripts organisés par fonction
│   ├── automation/               # Automatisation intelligente
│   │   ├── auto-integration.mjs   # Pipeline complet automatisé
│   │   ├── smart-automation.mjs   # Automatisation intelligente
│   │   ├── monitor-pipeline.mjs   # Surveillance complète
│   │   ├── monitor-simple.mjs     # Monitoring JSON simple
│   │   └── monitor-cron.mjs       # Surveillance des crons
│   ├── tests/                    # Scripts de test
│   ├── maintenance/              # Scripts de maintenance
│   └── docs/                     # Documentation
│
└── 📋 Fichiers de configuration
    ├── package.json              # Scripts npm et dépendances
    ├── docker-compose.yml        # Configuration Docker
    ├── Dockerfile                # Image Docker
    └── key.env                   # Variables d'environnement
```

## � **Workflow détaillé**

### 1. **📡 WireScanner - Collecte RSS**

- Récupération des flux RSS configurés
- Parsing et validation des articles
- Déduplication automatique
- Stockage dans `articlesUrl`
- **Déclenchement automatique** de Cortex

### 2. **🧠 Cortex - Traitement intelligent**

- Récupération des URLs non traitées
- Extraction de contenu web
- Génération de résumés automatiques
- Enrichissement des métadonnées
- Stockage dans `articles`

### 3. **🗄️ Base de données - Stockage structuré**

- **articlesUrl** : URLs collectées par WireScanner
- **articles** : Articles complets traités par Cortex
- **ListUrlRss** : Configuration des flux RSS
- Contraintes d'intégrité et déduplication

### 4. **📊 Monitoring - Surveillance continue**

- Métriques de performance en temps réel
- Détection automatique des problèmes
- Recommandations d'actions
- Logging complet et structuré

## ⚡ **Utilisation recommandée**

### 🚀 **Démarrage rapide**

```bash
# 1. Démarrer le système complet
npm start

# 2. Lancer la collecte automatique
npm run harvest

# 3. Surveiller l'état
npm run status
```

### 🤖 **Automatisation pour production**

```bash
# Pipeline intelligent qui analyse et agit
npm run harvest:auto

# Surveillance continue
npm run status:watch
```

### 🔍 **Diagnostic et maintenance**

```bash
# Vérifier la santé du système
npm run health

# Analyser les performances
npm run diagnostic

# Voir les statistiques
npm run stats
```

## 📚 **Documentation complète**

### 📖 **Guides détaillés**

- [Guide du scrapping manuel](./SCRAPPING_MANUAL_GUIDE.md)
- [Migration Webhook → Cortex](./WEBHOOK_TO_CORTEX_MIGRATION.md)
- [Schéma de base de données](./DATABASE_SCHEMA_GUIDE.md)
- [Guide des logs](./LOGS_GUIDE.md)
- [Migration de base de données](./DATABASE_MIGRATION_GUIDE.md)
- [Guide de déploiement Docker](./DOCKER_DEPLOY.md)
- [Documentation de sécurité](./SECURITY.md)

### � **Configuration et déploiement**

#### Variables d'environnement

```bash
# Configuration serveur
HEALTH_PORT=3000              # Port du serveur healthcheck
NODE_ENV=production           # Environnement d'exécution

# Configuration base de données
SUPABASE_URL=your_url         # URL Supabase
SUPABASE_ANON_KEY=your_key    # Clé anonyme Supabase

# Configuration performance
MAX_CONCURRENT_FEEDS=5        # Nombre max de flux simultanés
BATCH_SIZE=50                 # Taille des batches de traitement
```

#### Docker Compose

```yaml
# Utiliser docker-compose.yml fourni
docker-compose up -d
```

#### Configuration Coolify

```bash
# Health check URL
http://localhost:3000/health

# Build command
npm install

# Start command
npm start
```

## 🔄 **Planification et automatisation**

### ⏰ **Cron automatique intégré**

- **Scrapping RSS** : Tous les jours à 03:00 (Europe/Paris)
- **Vérification manuelle** : Toutes les 30 secondes
- **Intégration Cortex** : Automatique après chaque scrapping

### 🤖 **Automatisation recommandée avec crontab**

**✅ CONFIGURATION ACTIVE** - Crontab installé et fonctionnel :

```bash
# Automatisation intelligente toutes les 4 heures
0 */4 * * * cd "/Users/lucasgiza/Dévellopement/SentinelIQ/SentinelIQ Harvest " && npm run harvest:auto

# Surveillance système toutes les heures
0 * * * * cd "/Users/lucasgiza/Dévellopement/SentinelIQ/SentinelIQ Harvest " && npm run status

# Diagnostic quotidien à 6h du matin
0 6 * * * cd "/Users/lucasgiza/Dévellopement/SentinelIQ/SentinelIQ Harvest " && npm run diagnostic

# Nettoyage des logs le dimanche à 2h
0 2 * * 0 cd "/Users/lucasgiza/Dévellopement/SentinelIQ/SentinelIQ Harvest " && npm run logs:clean
```

#### 📋 **Logs de cron**

Les logs d'automatisation sont stockés dans `/tmp/` :

- `/tmp/sentineliq_smart.log` - Logs d'automatisation intelligente
- `/tmp/sentineliq_monitor.log` - Logs de surveillance
- `/tmp/sentineliq_diagnostic.log` - Logs de diagnostic
- `/tmp/sentineliq_cleanup.log` - Logs de nettoyage

#### 🔧 **Gestion du crontab**

```bash
# Voir la configuration actuelle
crontab -l

# Éditer la configuration
crontab -e

# Supprimer le crontab
crontab -r
```

### 📊 **Surveillance continue**

```bash
# Mode surveillance (recommandé pour production)
npm run status:watch

# Alertes automatiques basées sur l'état
npm run harvest:auto
```

## 🚨 **Dépannage et maintenance**

### 🔍 **Diagnostic rapide**

```bash
# État complet du système
npm run status

# Santé de la base de données
npm run health

# Test de connectivité
npm run _test:db

# Vérification du schéma
npm run _test:schema
```

### 🛠️ **Actions de maintenance courantes**

```bash
# Redémarrage des services
npm start

# Traitement manuel des URLs en attente
npm run harvest:process

# Collecte manuelle de nouveaux articles
npm run harvest:collect

# Nettoyage des logs anciens
npm run logs:clean

# Diagnostic complet avec métriques
npm run diagnostic
```

### ⚠️ **Résolution de problèmes fréquents**

#### **URLs en attente importantes (>1000)**

```bash
npm run harvest:process
# ou
npm run harvest:auto  # (recommandé - décision automatique)
```

#### **Pas d'activité récente**

```bash
npm run harvest:collect
# ou
npm run harvest       # Pipeline complet
```

#### **Erreurs de base de données**

```bash
npm run health
npm run _test:db
npm run _test:schema
```

#### **Performance dégradée**

```bash
npm run diagnostic
npm run logs:summary
npm run status
```

## 📈 **Métriques et statistiques**

### 📊 **Métriques disponibles**

- **Articles collectés** : Total et par période
- **URLs en attente** : Backlog de traitement
- **Performance** : Temps de traitement, mémoire utilisée
- **Flux RSS** : Validité et statistiques par source
- **Erreurs** : Taux d'erreur et causes principales

### � **Rapports automatiques**

```bash
# Rapport complet
npm run status

# Statistiques détaillées
npm run stats

# Résumé des logs
npm run logs:summary
```

## 🔒 **Sécurité et bonnes pratiques**

- **Variables d'environnement** : Stockage sécurisé des clés API
- **Validation d'entrée** : Sanitisation de tous les inputs
- **Rate limiting** : Protection contre la surcharge
- **Logging sécurisé** : Pas de données sensibles dans les logs
- **Accès restreint** : Authentification pour les endpoints sensibles

## 🎯 **Performances optimales**

### ⚡ **Configuration recommandée**

- **Node.js** : ≥18.0.0
- **Mémoire** : 2GB+ recommandé
- **Disque** : SSD recommandé pour les logs
- **Réseau** : Connexion stable pour les flux RSS

### 🚀 **Optimisations intégrées**

- **Batching intelligent** : Traitement par lots optimisé
- **Cache en mémoire** : Réduction des requêtes base
- **Connexions poolées** : Gestion efficace des connexions
- **Retry automatique** : Gestion robuste des erreurs temporaires

---

## 🤝 **Support et contribution**

### 📞 **Obtenir de l'aide**

1. **Vérifiez l'état** : `npm run status`
2. **Consultez les logs** : `npm run logs:summary`
3. **Diagnostic complet** : `npm run diagnostic`
4. **Testez l'intégration** : `npm run harvest:test`

### 🔄 **Mises à jour et évolution**

- **Surveillance intelligente** : Le système s'adapte automatiquement
- **Métriques continues** : Amélioration basée sur les données
- **Pipeline évolutif** : Architecture modulaire extensible

### 📧 **Contact**

- **Auteur** : Lucas Giza
- **Version** : 2.5.0 (Pipeline automatisé optimisé)
- **Licence** : MIT

---

**SentinelIQ Harvest** - _Collecte intelligente et automatisée d'articles RSS_ 🚀
