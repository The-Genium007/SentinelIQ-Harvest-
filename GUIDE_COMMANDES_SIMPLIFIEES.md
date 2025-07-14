# 📘 Guide d'utilisation simplifié - SentinelIQ Harvest

## 🎯 **Commandes principales (utilisateur final)**

### 🌾 **Collecte et traitement (HARVEST)**

```bash
npm run harvest          # 🚀 Pipeline complet automatique (recommandé)
npm run harvest:auto     # 🤖 Automatisation intelligente (analyse et décide)
npm run harvest:collect  # 📡 Collecte RSS uniquement
npm run harvest:process  # 🧠 Traitement des articles en attente
npm run harvest:test     # 🔬 Test d'intégration complet
```

### 📊 **Surveillance (STATUS)**

```bash
npm run status           # 📈 État du système en temps réel
npm run status:watch     # 👁️ Surveillance continue (5 min)
npm run status:json      # 🤖 Sortie JSON pour automatisation
```

### 🩺 **Santé système (HEALTH)**

```bash
npm run health           # ❤️ Santé de la base de données
npm run stats            # 📊 Statistiques globales complètes
```

### 🔧 **Maintenance (LOGS/DIAGNOSTIC)**

```bash
npm run diagnostic       # 🔍 Diagnostic complet du système
npm run logs:summary     # 📝 Résumé des logs récents
npm run logs:clean       # 🧹 Nettoyage des anciens logs
npm run rss:list         # 📋 Liste tous les flux RSS
npm run rss:stats        # 📊 Statistiques détaillées des flux
```

---

## 🛠️ **Commandes techniques (développement)**

### 🚀 **Démarrage**

```bash
npm start                # 🏃 Démarrage standard avec serveur healthcheck
npm run dev              # 🔧 Mode développement avec watch
```

### 🧪 **Tests et legacy** (préfixés par `_`)

```bash
npm run _test:db         # 🗄️ Test de connexion base
npm run _test:schema     # 📋 Test du schéma
npm run _test:rss        # 📡 Test des flux RSS
npm run _legacy:wire-scanner    # 🕷️ Ancien WireScanner avec cron
npm run _legacy:cortex          # 🧠 Ancien Cortex standalone
npm run _legacy:cortex-daemon   # 🤖 Ancien Cortex mode démon
```

---

## 💡 **Logique de simplification**

### ✅ **Avant (complexe - 50+ commandes)**

- `npm run auto-harvest`
- `npm run smart-automation`
- `npm run monitor`
- `npm run wire-scanner:direct`
- `npm run cortex:batch`
- `npm run db:health`
- `npm run db:stats`
- etc...

### ✅ **Après (simple - 15 commandes principales)**

- `npm run harvest` (pipeline complet)
- `npm run harvest:auto` (automatisation)
- `npm run status` (surveillance)
- `npm run health` (santé)
- `npm run stats` (statistiques)
- etc...

---

## 🎯 **Cas d'usage typiques**

### 🚀 **Démarrage rapide**

```bash
npm start                # Démarre le système
npm run harvest          # Lance la collecte
npm run status           # Vérifie l'état
```

### 🤖 **Production automatisée**

```bash
npm run harvest:auto     # Automatisation intelligente
npm run status:watch     # Surveillance continue
```

### 🔧 **Maintenance**

```bash
npm run health           # Vérifier la santé
npm run diagnostic       # Diagnostic complet
npm run logs:clean       # Nettoyer les logs
```

### 🐛 **Dépannage**

```bash
npm run status           # État général
npm run health           # Santé base de données
npm run _test:db         # Test connexion
npm run diagnostic       # Diagnostic approfondi
```

---

## 📈 **Crontab automatique mis à jour**

```bash
# Automatisation intelligente toutes les 4 heures
0 */4 * * * npm run harvest:auto

# Surveillance système toutes les heures
0 * * * * npm run status

# Diagnostic quotidien à 6h du matin
0 6 * * * npm run diagnostic

# Nettoyage des logs le dimanche à 2h
0 2 * * 0 npm run logs:clean
```

**🎉 Structure simplifiée, intuitive et maintenue !**
