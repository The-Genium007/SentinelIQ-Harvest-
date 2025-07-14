# 🔧 Scripts de Debug Coolify avec OrbStack

Collection de scripts pour déboguer rapidement ton application dans les conditions Coolify en utilisant OrbStack.

## 🚀 Utilisation Rapide avec OrbStack

```bash
# 1. Lance OrbStack (si pas déjà fait)
./start-orbstack.sh

# 2. Lancement complet avec vérifications
./start-test.sh

# 3. Debug si problème
./debug-quick.sh
```

## 📋 Pourquoi OrbStack ?

- ⚡ **Plus rapide** - Démarrage instantané vs Docker Desktop
- 🧠 **Moins de RAM** - Consommation mémoire optimisée
- 🔋 **Économie batterie** - Moins gourmand en ressources
- 🐳 **100% compatible** - Mêmes commandes Docker
- 🚀 **Natif Apple Silicon** - Optimisé pour M1/M2

## 📋 Commandes de Debug

### Pendant le test avec OrbStack
```bash
# Logs en temps réel
docker-compose -f docker-compose.test.yml logs -f

# Entrer dans le container
docker exec -it sentineliq-harvest-test sh

# Tester les endpoints
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/metrics
```

### Debug spécifique OrbStack
```bash
# Status OrbStack
orb status

# Voir les machines OrbStack
orb list

# Variables d'environnement dans le container
docker exec -it sentineliq-harvest-test printenv | grep -E "(NODE_ENV|PORT|SUPABASE)"
```

## 🛑 Arrêter le test
```bash
docker-compose -f docker-compose.test.yml down
```

## 📝 Configuration

Avant de lancer, modifie `docker-compose.test.yml` avec tes vraies variables Supabase :

```yaml
environment:
  - SUPABASE_URL=https://ton-projet.supabase.co
  - SUPABASE_ANON_KEY=ta_clé_publique_supabase
```

## 🎯 Objectif

Reproduire **exactement** l'environnement Coolify pour déboguer localement avant déploiement.

- ✅ Alpine Linux Node.js 18
- ✅ Variables d'environnement identiques  
- ✅ Mode production
- ✅ Healthcheck Coolify
- ✅ Même configuration Puppeteer
