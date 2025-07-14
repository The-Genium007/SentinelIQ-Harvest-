# Configuration Coolify pour SentinelIQ Harvest v2.5.1

## 📋 Configuration générale
- **Application Name:** SentinelIQ Harvest
- **Type:** Dockerfile
- **Port:** 3000
- **Repository:** The-Genium007/SentinelIQ-Harvest-
- **Branch:** main

## 🌍 Variables d'environnement
```bash
NODE_ENV=production
PORT=3000
HEALTH_PORT=3000
NODE_OPTIONS=--max-old-space-size=2048

# Supabase Configuration (à configurer selon votre instance)
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

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

## 📝 Points d'attention
1. **Variables Supabase:** Configurez impérativement SUPABASE_URL et SUPABASE_ANON_KEY
2. **Health endpoint:** L'application expose `/health`, `/ready`, et `/metrics`
3. **Start period:** 60s recommandé pour le démarrage initial de Node.js
4. **Memory:** 2GB recommandé pour le traitement des articles

## 🔍 Endpoints disponibles
- `GET /health` - Status de santé principal
- `GET /ready` - Vérification de disponibilité
- `GET /metrics` - Métriques système
- `GET /` - Dashboard principal

## 🐛 Dépannage
- Si le healthcheck échoue, vérifiez que le port 3000 est bien exposé
- Augmentez le start period si le démarrage est lent
- Vérifiez les logs de démarrage pour les erreurs Supabase
