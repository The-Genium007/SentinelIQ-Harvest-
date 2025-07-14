# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

## [2.5.1] - 2025-07-14

### 🚨 HOTFIXES CRITIQUES - Déploiement Docker Alpine Linux

#### Hotfix #5 - Correction Logger Function (URGENT)
- **Problème**: `logger.warn is not a function` bloquant le démarrage de ScrapingEngine
- **Solution**: Correction de toutes les occurrences `logger.warn` vers `logger.warning`
- **Impact**: Services démarrent maintenant sans erreur de fonction logger
- **Fichiers modifiés**:
  - `Cortex/scrapingEngine.js`: logger.warn → logger.warning  
  - `Cortex/puppeteerManager.js`: Toutes les occurrences corrigées
  - **Stabilité**: Logger functions utilisées correctement

#### Hotfix #6 - Puppeteer Full Container Compatibility (RÉSOLU) ✅
- **Problème**: Puppeteer complètement désactivé en conteneur (mode dégradé)
- **Solution**: Configuration container-native avec 40+ arguments Chromium optimisés
- **Impact**: Puppeteer maintenant 100% fonctionnel en conteneur Docker Alpine
- **Fichiers modifiés**:
  - `Cortex/config.js`: Configuration CONTAINER dédiée avec détection auto
  - `Cortex/puppeteerManager.js`: Test isContainerCompatible() + fallback progressif
  - `Cortex/scrapingEngine.js`: Gestion propriété puppeteerCompatible
  - `docker-compose.test.yml`: Variables d'environnement container
  - `.env.container`: Configuration spécifique conteneur
- **Résultats**: Scraping d'articles réussi avec temps 141ms-1305ms par article
- **Performance**: Browser pool, navigation parallèle, stabilité complète

#### Hotfix #4 - Désactivation Puppeteer en Conteneur (OBSOLÈTE)
- **Problème**: Erreurs persistantes "Protocol error (Target.setDiscoverTargets): Target closed" bloquant le démarrage
- **Solution**: Désactivation complète de Puppeteer en mode conteneur/production ⚠️ REMPLACÉ PAR HOTFIX #6
- **Impact**: Services démarrent maintenant sans erreur, mode dégradé géré gracieusement
- **Fichiers modifiés**:
  - `Cortex/puppeteerManager.js`: Blocage création navigateur en production
  - `Cortex/scrapingEngine.js`: Mode dégradé sans Puppeteer
  - **Stabilité**: Container services démarrent correctement

#### Hotfix #3 - Production Mode Puppeteer (CRITIQUE)
- **Problème**: Tests de compatibilité Puppeteer bloquant en environnement conteneur
- **Solution**: Skip automatique des tests en production/conteneur
- **Impact**: Évite les erreurs de protocole SSL et timeouts
- **Fichiers modifiés**:
  - `Cortex/puppeteerManager.js`: Test skipping avec détection container

#### Hotfix #2 - Chromium Alpine Linux (CRITIQUE)
- **Problème**: "Browser was not found at configured executablePath" dans container Alpine
- **Solution**: Installation complète de Chromium et dépendances Alpine
- **Impact**: Puppeteer peut maintenant démarrer dans l'environnement containerisé
- **Fichiers modifiés**:
  - `Dockerfile`: `apk add chromium nss freetype harfbuzz ca-certificates fonts-liberation`
  - `Cortex/config.js`: Détection Alpine + 25+ arguments Chromium
  - Variables d'environnement: `PUPPETEER_EXECUTABLE_PATH`, `PUPPETEER_DISABLE_SECURITY`

#### Hotfix #1 - Container Compatibility (CRITIQUE)
- **Problème**: Échecs de déploiement sur Coolify/Ionos VPS avec erreurs Puppeteer
- **Solution**: Configuration Docker optimisée pour Alpine Linux
- **Impact**: Container build et deploy réussissent
- **Infrastructure**: 
  - Support complet Alpine Linux Node.js 18
  - Chromium headless operationnel en conteneur
  - Healthcheck endpoints fonctionnels

#### Hotfix #7 - Gestion Services One-Shot (RÉSOLU) ✅
- **Problème**: Erreurs "Command failed" WireScanner/Cortex au démarrage, services one-shot mal gérés
- **Solution**: Gestion différenciée services persistants vs one-shot avec terminaison normale
- **Impact**: System stable, plus d'erreurs de démarrage, services fonctionnent correctement
- **Fichiers modifiés**:
  - `index.js`: Correction gestion terminaison normale Cortex (code 0)
  - **Architecture**: WireScanner (persistant) + Cortex (one-shot) + HealthServer (persistant)
- **Résultats**: 18/26 articles traités, optimisations DB opérationnelles, aucune erreur système

### 🔧 Améliorations Techniques
- **Détection plateforme automatique** - Support macOS, Debian, Alpine Linux
- **Pool de navigateurs optimisé** - Gestion mémoire selon la plateforme
- **Configuration Puppeteer flexible** - Arguments adaptatifs par environnement
- **Monitoring performances** - Tracking ressources et métriques
- **Healthcheck robuste** - Endpoints `/health`, `/ready`, `/metrics`
- **Container-native Puppeteer** ✅ - Configuration dédiée avec 40+ arguments Chromium
- **Fallback progressif** - Détection compatibility automatique avec dégradation gracieuse
- **Optimisation mémoire conteneur** - Limites 256MB, pool size=1, timeouts adaptés

### 🐛 Corrigé
- Erreurs "Cannot access 'process' before initialization" dans diagnostic
- Timeout services lors du démarrage en environnement conteneur
- Buffer overflow sur stdout/stderr des services
- Problèmes de compatibilité Chromium multi-plateformes
- Erreurs de fonction logger (`logger.warn` inexistante)
- **Puppeteer complètement désactivé en conteneur** ✅ RÉSOLU
- **Runtime errors undefined properties** ✅ RÉSOLU (puppeteerCompatible property)
- **Container protocol errors** ✅ RÉSOLU (configuration container-optimisée)

## [2.5.0] - 2025-07-14

### ✨ Nouveau
- **Automatisation intelligente complète** - Pipeline auto-adaptatif avec monitoring
- **Smart Automation** - Script d'automatisation avec analyse d'état système
- **Intégration monitoring avancé** - Surveillance continue du pipeline
- **Scripts de test complets** - Suite de tests pour tous les composants

### 🔧 Améliorations
- **Performance optimisée** - Gestion mémoire et pool de ressources
- **Architecture modulaire** - Séparation claire WireScanner/Cortex
- **Logging structuré** - Système de logs centralisé avec niveaux
- **Configuration flexible** - Support multi-environnements

### 🚀 Fonctionnalités
- Pipeline de collecte et traitement RSS automatisé
- Scraping d'articles avec extraction de contenu intelligent
- Base de données Supabase pour stockage articles
- API healthcheck pour monitoring production
- Scripts npm pour faciliter l'utilisation

## [1.0.0] - 2025-07-13

### ✨ Version Initiale
- Configuration de base du projet SentinelIQ Harvest
- Structure de fichiers et architecture initiale
- Documentation et guides d'utilisation
