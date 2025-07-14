#!/bin/bash

# 🔍 Debug Rapide - Problèmes Courants

echo "🔍 DIAGNOSTIC RAPIDE - Container de Test"
echo "========================================"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
    fi
}

warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# 1. Vérifier si le container tourne
info "Vérification du container..."
if docker ps | grep -q "sentineliq-harvest-test"; then
    check "Container en cours d'exécution"
else
    warning "Container non trouvé. Lance d'abord: ./start-test.sh"
    exit 1
fi

# 2. Test des endpoints
info "Test des endpoints..."
curl -s -f http://localhost:3000/health > /dev/null
check "Endpoint /health"

curl -s -f http://localhost:3000/ready > /dev/null
check "Endpoint /ready"

curl -s -f http://localhost:3000/metrics > /dev/null
check "Endpoint /metrics"

# 3. Vérifications internes du container
info "Vérifications internes..."

# Node.js
docker exec -it sentineliq-harvest-test node --version > /dev/null 2>&1
check "Node.js disponible"

# Chromium
docker exec -it sentineliq-harvest-test chromium-browser --version > /dev/null 2>&1
check "Chromium installé"

# Variables d'environnement critiques
docker exec -it sentineliq-harvest-test printenv NODE_ENV | grep -q "production"
check "NODE_ENV=production"

docker exec -it sentineliq-harvest-test printenv DOCKER_ENV | grep -q "true"
check "DOCKER_ENV=true"

# 4. Processus en cours
info "Processus Node.js actifs:"
docker exec -it sentineliq-harvest-test ps aux | grep node

# 5. État des services (depuis l'endpoint)
echo ""
info "État actuel des services:"
echo "=========================="
curl -s http://localhost:3000/health | jq . 2>/dev/null || curl -s http://localhost:3000/health

# 6. Logs récents
echo ""
info "Logs des 20 dernières lignes:"
echo "=============================="
docker-compose -f docker-compose.test.yml logs --tail=20

# 7. Suggestions de correction
echo ""
info "🔧 SUGGESTIONS DE DEBUG:"
echo "========================"
echo "  • Logs en temps réel : docker-compose -f docker-compose.test.yml logs -f"
echo "  • Entrer dans le container : docker exec -it sentineliq-harvest-test sh"
echo "  • Redémarrer le service : docker-compose -f docker-compose.test.yml restart"
echo "  • Variables d'environnement : docker exec -it sentineliq-harvest-test printenv"
echo "  • Test Chromium : docker exec -it sentineliq-harvest-test chromium-browser --headless --no-sandbox --dump-dom about:blank"
