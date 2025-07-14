# 🐳 Test Local avec Conditions Coolify Identiques

Ce guide te permet de reproduire exactement l'environnement Coolify/Alpine Linux en local pour déboguer avant déploiement.

## 🎯 Objectif
Tester SentinelIQ Harvest dans les mêmes conditions que le déploiement Coolify :
- Alpine Linux Node.js 18
- Variables d'environnement identiques
- Port 3000 exposé
- Mode production

## 🚀 Setup Rapide

### 1. Dockerfile de Test Local
Créer `Dockerfile.local-test` :

```dockerfile
# Image identique à Coolify
FROM node:18-alpine

# Variables d'environnement identiques à Coolify
ENV NODE_ENV=production
ENV PORT=3000
ENV HEALTH_PORT=3000
ENV NODE_OPTIONS=--max-old-space-size=2048
ENV DOCKER_ENV=true
ENV PUPPETEER_DISABLE_SECURITY=true

# Installation des dépendances Alpine (identique au Dockerfile prod)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    fonts-liberation \
    bash \
    curl

# Configuration Puppeteer pour Alpine
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances Node.js
RUN npm install --production

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 3000

# Healthcheck identique à la production
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Commande de démarrage
CMD ["npm", "start"]
```

### 2. Docker Compose pour Test Local

Créer `docker-compose.test.yml` :

```yaml
version: '3.8'

services:
  sentineliq-test:
    build:
      context: .
      dockerfile: Dockerfile.local-test
    container_name: sentineliq-harvest-test
    ports:
      - "3000:3000"
    environment:
      # Variables identiques à Coolify
      - NODE_ENV=production
      - PORT=3000
      - HEALTH_PORT=3000
      - NODE_OPTIONS=--max-old-space-size=2048
      - DOCKER_ENV=true
      - PUPPETEER_DISABLE_SECURITY=true
      # ⚠️ Remplace par tes vraies variables Supabase
      - SUPABASE_URL=your_supabase_url_here
      - SUPABASE_ANON_KEY=your_supabase_anon_key_here
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    # Logs pour debug
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. Script de Test Automatisé

Créer `test-local-coolify.sh` :

```bash
#!/bin/bash

echo "🐳 TEST LOCAL - Conditions Coolify Identiques"
echo "============================================="

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# 1. Nettoyage préalable
log "Nettoyage des containers existants..."
docker-compose -f docker-compose.test.yml down --remove-orphans
docker system prune -f

# 2. Build du container de test
log "Build du container de test (Alpine Linux)..."
if docker-compose -f docker-compose.test.yml build; then
    success "Build réussi"
else
    error "Échec du build"
    exit 1
fi

# 3. Démarrage du container
log "Démarrage du container de test..."
if docker-compose -f docker-compose.test.yml up -d; then
    success "Container démarré"
else
    error "Échec du démarrage"
    exit 1
fi

# 4. Attendre le démarrage
log "Attente du démarrage des services (60s)..."
sleep 60

# 5. Tests de santé
log "Test des endpoints de santé..."

# Test /health
if curl -s -f http://localhost:3000/health > /dev/null; then
    success "Endpoint /health OK"
else
    error "Endpoint /health ÉCHEC"
fi

# Test /ready  
if curl -s -f http://localhost:3000/ready > /dev/null; then
    success "Endpoint /ready OK"
else
    warning "Endpoint /ready ÉCHEC (normal si services optionnels)"
fi

# Test /metrics
if curl -s -f http://localhost:3000/metrics > /dev/null; then
    success "Endpoint /metrics OK"
else
    error "Endpoint /metrics ÉCHEC"
fi

# 6. Affichage des logs
log "Logs des dernières 50 lignes :"
echo "================================"
docker-compose -f docker-compose.test.yml logs --tail=50

# 7. Status des services
log "Status des services :"
echo "===================="
curl -s http://localhost:3000/health | jq . 2>/dev/null || curl -s http://localhost:3000/health

echo ""
log "Container en cours d'exécution. Commandes utiles :"
echo "  📊 Voir les logs en temps réel : docker-compose -f docker-compose.test.yml logs -f"
echo "  🔍 Inspecter le container : docker exec -it sentineliq-harvest-test sh"
echo "  ⚙️ Tester un endpoint : curl http://localhost:3000/health"
echo "  🛑 Arrêter le test : docker-compose -f docker-compose.test.yml down"
```

## 🔧 Utilisation

### Démarrage rapide
```bash
# Donner les permissions d'exécution
chmod +x test-local-coolify.sh

# Lancer le test
./test-local-coolify.sh
```

### Commandes utiles pendant le test

```bash
# Voir les logs en temps réel
docker-compose -f docker-compose.test.yml logs -f

# Entrer dans le container pour déboguer
docker exec -it sentineliq-harvest-test sh

# Tester les endpoints
curl http://localhost:3000/health
curl http://localhost:3000/ready  
curl http://localhost:3000/metrics

# Redémarrer juste le service (sans rebuild)
docker-compose -f docker-compose.test.yml restart

# Arrêter le test
docker-compose -f docker-compose.test.yml down
```

### Debug avancé

```bash
# Voir les variables d'environnement dans le container
docker exec -it sentineliq-harvest-test printenv

# Voir les processus en cours
docker exec -it sentineliq-harvest-test ps aux

# Tester Chromium manuellement
docker exec -it sentineliq-harvest-test chromium-browser --version

# Voir les logs système Alpine
docker exec -it sentineliq-harvest-test dmesg
```

## 🐛 Debugging des Problèmes Courants

### 1. Problème Puppeteer
```bash
# Vérifier si Chromium est installé
docker exec -it sentineliq-harvest-test which chromium-browser

# Tester le lancement de Chromium
docker exec -it sentineliq-harvest-test chromium-browser --headless --no-sandbox --dump-dom about:blank
```

### 2. Problème Variables d'environnement
```bash
# Voir toutes les variables
docker exec -it sentineliq-harvest-test printenv | grep -E "(NODE_ENV|PORT|SUPABASE)"
```

### 3. Problème Réseau
```bash
# Tester la connectivité depuis le container
docker exec -it sentineliq-harvest-test curl -I https://www.google.com
```

## 📋 Checklist de Validation

Avant de déployer sur Coolify, vérifier que :

- [ ] ✅ Container démarre sans erreur
- [ ] ✅ Endpoint `/health` répond 200
- [ ] ✅ Endpoint `/ready` répond (200 ou 503 acceptable)  
- [ ] ✅ Endpoint `/metrics` répond 200
- [ ] ✅ Logs montrent "Serveur healthcheck démarré"
- [ ] ✅ Pas d'erreur "logger.warn is not a function"
- [ ] ✅ Pas d'erreur "Protocol error" Puppeteer
- [ ] ✅ Services démarrent en mode dégradé acceptable

## 🎯 Avantages de cette Méthode

1. **Environnement identique** - Même Alpine Linux, même Node.js 18
2. **Variables identiques** - Reproduction exacte de la configuration Coolify
3. **Debug facile** - Logs et accès shell pour investiguer
4. **Itération rapide** - Test local sans attendre le déploiement Coolify
5. **Validation complète** - Tous les endpoints testés automatiquement

## 🚀 Workflow Recommandé

1. **Modifier le code** localement
2. **Tester avec ce setup** local Coolify-like  
3. **Valider tous les endpoints** et logs
4. **Commiter et pusher** vers GitHub
5. **Déployer sur Coolify** en confiance

Cette méthode va considérablement réduire les cycles de debug et garantir que ça fonctionne sur Coolify ! 🎉
