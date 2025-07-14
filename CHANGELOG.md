# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

## [2.5.1] - 2025-07-14

### 🐛 Corrigé
- **Déploiement Docker** - Suppression de la référence au fichier `healthcheck.sh` manquant
- **Healthcheck intégré** - Remplacement par un healthcheck curl utilisant l'endpoint `/health` existant
- **Compatibilité Coolify** - Résolution des problèmes de déploiement sur Ionos VPS

### 🔧 Technique
- Simplification du Dockerfile pour éviter les dépendances de fichiers externes
- Utilisation du endpoint `/health` déjà implémenté dans `index.js`
- Optimisation de la phase de build Docker

## [2.5.0] - 2025-07-14

### 🚀 Ajouté
- **Pipeline d'automatisation intelligente** - Système de prise de décision automatique
- **Scripts d'automatisation avancés** - `smart-automation.mjs` avec logique de décision
- **Monitoring en temps réel** - Surveillance continue de l'état du pipeline
- **Traitement par lots optimisé** - Gestion intelligente des batches de 200 articles
- **Détection d'état automatique** - Analyse automatique du backlog et des besoins
- **Système de recommandations** - Suggestions automatiques pour les prochaines actions

### 🔧 Amélioré
- **Performance du pipeline** - Optimisation des processus de traitement
- **Gestion des erreurs** - Meilleure robustesse du système
- **Interface utilisateur** - Commandes simplifiées et plus intuitives
- **Documentation** - Guide complet des commandes simplifiées
- **Logs structurés** - Système de logging plus détaillé et organisé

### 🐛 Corrigé
- **Synchronisation des processus** - Résolution des problèmes de concurrence
- **Validation des données** - Amélioration de la robustesse des imports
- **Gestion mémoire** - Optimisation pour les gros volumes de données
- **Scripts d'automatisation** - Correction des références de commandes

### 📚 Documentation
- **GUIDE_COMMANDES_SIMPLIFIEES.md** - Guide des commandes utilisateur
- **SIMPLIFICATION_COMPLETE.md** - Documentation technique complète
- **AUTOMATION_SETUP_COMPLETE.md** - Guide de configuration de l'automatisation

### 🔄 Architecture
- **Séparation des responsabilités** - WireScanner (collecte) + Cortex (traitement)
- **Pipeline modulaire** - Composants indépendants et réutilisables
- **Automatisation intelligente** - Système décisionnel basé sur l'état du système

---

## [2.0.0] - 2025-07-13

### 🚀 Ajouté
- **Architecture complètement refactorisée** - Séparation WireScanner/Cortex
- **Pipeline automatisé** - Workflow complet de collecte et traitement
- **Base de données Supabase** - Migration vers PostgreSQL cloud
- **Système de monitoring** - Surveillance en temps réel du pipeline
- **Scripts de maintenance** - Outils de diagnostic et gestion

### 🔧 Amélioré
- **Performance globale** - Optimisation des requêtes et du traitement
- **Stabilité** - Gestion d'erreurs robuste
- **Évolutivité** - Architecture modulaire et extensible

### 🐛 Corrigé
- **Problèmes de synchronisation** - Entre collecte et traitement
- **Fuites mémoire** - Optimisation de la gestion des ressources
- **Erreurs de validation** - Amélioration de la robustesse

---

## [1.0.0] - 2025-07-12

### 🚀 Ajouté
- **Version initiale** - Prototype fonctionnel
- **Collecte RSS** - Système de scraping de base
- **Traitement d'articles** - Pipeline de base
- **Interface web** - Dashboard simple

### 📝 Notes de migration

#### De 2.0.x vers 2.5.0
- Aucune action requise - Migration transparente
- Les nouvelles fonctionnalités d'automatisation sont disponibles immédiatement
- Les anciennes commandes restent compatibles

#### De 1.x vers 2.0.x
- Migration de base de données requise
- Nouvelle configuration Supabase
- Scripts de migration fournis

---

## Légende des types de changements

- 🚀 **Ajouté** - Nouvelles fonctionnalités
- 🔧 **Amélioré** - Améliorations de fonctionnalités existantes
- 🐛 **Corrigé** - Corrections de bugs
- 📚 **Documentation** - Changements dans la documentation
- 🔄 **Architecture** - Changements structurels
- ⚠️ **Déprécié** - Fonctionnalités dépréciées
- ❌ **Supprimé** - Fonctionnalités supprimées
- 🔒 **Sécurité** - Corrections de vulnérabilités
