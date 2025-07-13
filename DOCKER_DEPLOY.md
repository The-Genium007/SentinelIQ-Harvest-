# Déploiement Docker - SentinelIQ Harvest

## Améliorations Healthcheck

### Problème résolu

Le déploiement Coolify échouait car le healthcheck ne pouvait pas se connecter au serveur sur le port 3000.

### Solutions implémentées

#### 1. Script de healthcheck robuste (`healthcheck.sh`)

- Supporte multiple méthodes de test : `curl`, `wget`, `netcat`
- Utilise `127.0.0.1` au lieu de `localhost` pour éviter les problèmes de résolution DNS
- Logging détaillé pour le debug
- Timeouts configurables

#### 2. Dockerfile amélioré

- Installation de `curl` et `netcat-openbsd` pour les tests
- Healthcheck avec timeouts augmentés (30s intervalle, 30s start-period)
- Script de healthcheck exécutable

#### 3. Serveur healthcheck intégré (`index.js`)

- Serveur HTTP sur port 3000 avec endpoints :
  - `GET /health` - État global du système
  - `GET /ready` - Disponibilité des services
  - `GET /metrics` - Métriques de performance
- Écoute sur `0.0.0.0` pour accepter toutes les connexions
- Auto-test de la healthcheck au démarrage

#### 4. Docker Compose (optionnel)

Configuration complète pour déploiement local ou alternative à Coolify.

## Endpoints de monitoring

### `/health`

Retourne l'état général du système :

```json
{
  "status": "healthy|degraded|unhealthy",
  "uptime": "2m 30s",
  "services": {
    "diagnostic": true,
    "wireScanner": false,
    "cortex": true,
    "healthServer": true
  },
  "timestamp": "2025-01-13T16:30:00.000Z"
}
```

### `/ready`

Indique si l'application est prête à recevoir du trafic :

```json
{
  "ready": true,
  "message": "All critical services are operational"
}
```

### `/metrics`

Métriques système pour monitoring :

```json
{
  "memory": {
    "used": "150 MB",
    "total": "500 MB",
    "percentage": 30
  },
  "uptime": "2m 30s",
  "processes": {
    "active": 3,
    "total": 3
  }
}
```

## Debugging

### Test local de la healthcheck

```bash
# Dans le container
/usr/local/bin/healthcheck.sh

# Ou avec curl
curl -f http://127.0.0.1:3000/health
```

### Logs de déploiement

Les logs sont disponibles dans :

- Container : `/app/logs/`
- Local : `./logs/`

### Ports

- `3000` : Serveur healthcheck et API
- Exposition Docker : `3000:3000`

## Déploiement Coolify

1. **Push des modifications** vers le repository Git
2. **Redéploiement** depuis l'interface Coolify
3. **Monitoring** des logs de healthcheck
4. **Vérification** des endpoints une fois déployé

### Commandes de debug Coolify

```bash
# Vérifier les logs du container
docker logs <container_id>

# Tester la healthcheck manuellement
docker exec <container_id> /usr/local/bin/healthcheck.sh

# Tester les endpoints
curl http://<domain>/health
curl http://<domain>/ready
curl http://<domain>/metrics
```
