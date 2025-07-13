# 🎯 SentinelIQ Harvest

Système de collecte et d'analyse d'articles via RSS avec intégration Cortex.

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

## 🚀 Scripts disponibles

### Scrapping et analyse

```bash
# Scrapping automatique (cron 03:00)
npm run wire-scanner

# Scrapping manuel (à la demande)
npm run scrapping

# Analyse Cortex
npm run cortex
```

### Base de données

```bash
# Tests et diagnostics
npm run db:test          # Test simple
npm run db:test-full     # Test complet
npm run db:health        # État de santé
npm run db:schema        # Schéma des tables

# Statistiques
npm run db:stats         # Statistiques globales
```

### Logs et diagnostic

```bash
npm run logs:analyze     # Analyse des logs
npm run logs:summary     # Résumé des logs
npm run logs:clean       # Nettoyage
npm run diagnostic       # Diagnostic complet
```

## 🔧 Architecture

```
SentinelIQ Harvest/
├── WireScanner/         # Collecte RSS
├── Cortex/              # Analyse articles
├── database/            # Couche base de données
├── utils/               # Utilitaires (logs, etc.)
└── logs/                # Fichiers de logs
```

## 📋 Workflow

1. **WireScanner** : Collecte les articles RSS
2. **Cortex** : Analyse et traite les articles
3. **Database** : Stockage structuré
4. **Logs** : Monitoring et diagnostic

## ⚡ Utilisation rapide

```bash
# Lancer un scrapping maintenant
npm run scrapping

# Vérifier l'état de la base
npm run db:health

# Analyser les logs récents
npm run logs:summary
```

## 📚 Documentation

- [Guide du scrapping manuel](./SCRAPPING_MANUAL_GUIDE.md)
- [Migration Webhook → Cortex](./WEBHOOK_TO_CORTEX_MIGRATION.md)
- [Schéma de base de données](./DATABASE_SCHEMA_GUIDE.md)
- [Guide des logs](./LOGS_GUIDE.md)
- [Migration de base de données](./DATABASE_MIGRATION_GUIDE.md)

## 🔄 Planification

- **Scrapping automatique** : Tous les jours à 03:00 (Europe/Paris)
- **Scrapping manuel** : À la demande via `npm run scrapping`
- **Intégration Cortex** : Automatique après chaque scrapping

---

Pour plus de détails, consultez les guides de documentation spécifiques.
