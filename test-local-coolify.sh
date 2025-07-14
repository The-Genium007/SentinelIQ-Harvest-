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
