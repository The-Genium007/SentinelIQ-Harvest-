# 🔧 Scripts de Debug Coolify

Collection de scripts pour déboguer rapidement ton application dans les conditions Coolify.

## 🚀 Utilisation Rapide

```bash
# Lancement complet avec vérifications
./start-test.sh

# Ou directement le test (si Supabase déjà configuré)
./test-local-coolify.sh
```

## 📋 Commandes de Debug

### Pendant le test
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

### Debug spécifique
```bash
# Voir les variables d'environnement
docker exec -it sentineliq-harvest-test printenv | grep -E "(NODE_ENV|PORT|SUPABASE)"

# Tester Chromium
docker exec -it sentineliq-harvest-test chromium-browser --version

# Voir les processus
docker exec -it sentineliq-harvest-test ps aux
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
