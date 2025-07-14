# Configuration Coolify pour SentinelIQ Harvest v2.5.1

## 📋 Configuration générale
- **Application Name:** SentinelIQ Harvest
- **Type:** Dockerfile
- **Port:** 3000
- **Repository:** The-Genium007/SentinelIQ-Harvest-
- **Branch:** main

## 🌍 Variables d'environnement

**⚠️ Configurez ces variables dans l'interface Coolify :**

```bash
NODE_ENV=production
PORT=3000
HEALTH_PORT=3000
NODE_OPTIONS=--max-old-space-size=2048

# Supabase Configuration - OBLIGATOIRE
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_KEY=your_supabase_service_role_key
```

**📁 Variables locales :**
- Les vraies clés sont dans `key.env` (ne pas committer)
- Le fichier `.env` contient les variables générales
- Pour les tests locaux, les scripts chargent automatiquement `key.env`

## 🏥 Health Check
- **Enabled:** ✅ Yes
- **Path:** `/health`
- **Port:** `3000`
- **Method:** `GET`
- **Interval:** `30s`
- **Timeout:** `10s`
- **Retries:** `3`
- **Start Period:** `60s`

## 🚀 Deployment
- **Build Command:** (laisser vide - utilise le Dockerfile)
- **Dockerfile Location:** `./Dockerfile`
- **Zero Downtime:** ✅ Yes
- **Auto Deploy:** ✅ Yes (sur push main)

## 🔒 Sécurité et Variables d'Environnement

**📁 Structure des fichiers :**
- `.env` : Variables générales (committé)
- `key.env` : Clés sensibles Supabase (protégé par .gitignore) 
- `.env.example` : Template avec des valeurs d'exemple

**🔐 Protection des secrets :**
- ✅ Les clés Supabase ne sont JAMAIS committées
- ✅ Documentation sans valeurs sensibles
- ✅ Tests locaux utilisent les vraies variables via `env_file`
- ✅ Coolify utilise les variables configurées dans l'interface

## 🔒 Domaine et SSL
- **Domain:** Configurez selon vos besoins
- **Generate SSL:** ✅ Yes
- **Force HTTPS:** ✅ Yes

## 📊 Monitoring (recommandé)
- **Resource Limits:** 
  - CPU: 1 core
  - Memory: 2048MB
- **Restart Policy:** `unless-stopped`

## 🔧 Configuration avancée
- **Custom healthcheck:** Désactivé (utilise celui de Coolify)
- **Build args:** Aucun nécessaire
- **Volumes:** Aucun nécessaire (logs en container)

## 🧪 Test Local avec Conditions Identiques (OrbStack)

Pour déboguer efficacement avant déploiement Coolify avec OrbStack :

```bash
# 1. Lance OrbStack (plus rapide que Docker Desktop)
./start-orbstack.sh

# 2. Configuration de test local avec environnement Alpine identique
./start-test.sh

# 3. Test complet avec Supabase configuré
./test-local-supabase.sh

# 4. Debug rapide des problèmes
./debug-quick.sh
```

**Pourquoi OrbStack ?**
- ✅ Plus rapide que Docker Desktop
- ✅ Moins de consommation de ressources
- ✅ Démarrage instantané des containers
- ✅ Compatible 100% avec Docker

Voir `docs/LOCAL_COOLIFY_TEST.md` pour le guide complet.

## 📝 Points d'attention
1. **Variables Supabase:** Configurez les variables dans l'interface Coolify (ne jamais committer les vraies clés)
2. **Fichiers d'environnement:** `.env` et `key.env` sont protégés par `.gitignore`
3. **Health endpoint:** L'application expose `/health`, `/ready`, et `/metrics`
4. **Start period:** 60s recommandé pour le démarrage initial de Node.js
5. **Memory:** 2GB recommandé pour le traitement des articles
6. **Test local:** Utilise `./test-local-supabase.sh` pour tester avec Supabase complet

## 🔍 Endpoints disponibles
- `GET /health` - Status de santé principal
- `GET /ready` - Vérification de disponibilité
- `GET /metrics` - Métriques système
- `GET /` - Dashboard principal

## 🐛 Dépannage
- Si le healthcheck échoue, vérifiez que le port 3000 est bien exposé
- Augmentez le start period si le démarrage est lent
- Vérifiez les logs de démarrage pour les erreurs Supabase
