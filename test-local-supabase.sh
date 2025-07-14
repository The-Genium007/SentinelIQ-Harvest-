#!/bin/bash

# 🔧 Test Local avec Configuration Supabase Complète
# ===================================================

echo "🐳 TEST LOCAL - Configuration Supabase Complète (OrbStack)"
echo "======================================================="

# Vérification OrbStack
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Vérification d'OrbStack..."
if ! command -v orb &> /dev/null; then
    echo "❌ OrbStack non installé. Installation requise."
    exit 1
fi

if ! orb status | grep -q "Running"; then
    echo "🚀 Démarrage d'OrbStack..."
    orb start
    sleep 5
fi

echo "✅ OrbStack opérationnel"

# Chargement des variables Supabase depuis key.env
if [ -f "key.env" ]; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] Chargement des variables Supabase..."
    source key.env
    export SUPABASE_URL
    export SUPABASE_KEY
    echo "✅ Variables Supabase chargées"
else
    echo "⚠️  Fichier key.env non trouvé - utilise les variables du docker-compose"
fi

# Nettoyage containers précédents
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Nettoyage des containers existants..."
docker-compose -f docker-compose.test.yml down --remove-orphans 2>/dev/null
docker system prune -f > /dev/null 2>&1

# Build du container
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Build du container avec Supabase configuré..."
if ! docker-compose -f docker-compose.test.yml build; then
    echo "❌ Échec du build"
    exit 1
fi

echo "✅ Build réussi"

# Démarrage du container
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Démarrage du container avec Supabase..."
if ! docker-compose -f docker-compose.test.yml up -d; then
    echo "❌ Échec du démarrage"
    exit 1
fi

echo "✅ Container démarré avec Supabase"

# Attente du démarrage complet
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Attente du démarrage complet (90s pour Supabase)..."
sleep 90

# Tests des endpoints
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Test des endpoints avec Supabase..."

# Test /health
if curl -s -f http://localhost:3000/health > /dev/null; then
    echo "✅ Endpoint /health OK"
else
    echo "❌ Endpoint /health ÉCHEC"
fi

# Test /ready (devrait maintenant fonctionner avec Supabase)
if curl -s -f http://localhost:3000/ready > /dev/null; then
    echo "✅ Endpoint /ready OK (Supabase connecté)"
else
    echo "⚠️ Endpoint /ready ÉCHEC (vérifier connexion Supabase)"
fi

# Test /metrics
if curl -s -f http://localhost:3000/metrics > /dev/null; then
    echo "✅ Endpoint /metrics OK"
else
    echo "❌ Endpoint /metrics ÉCHEC"
fi

# Affichage des logs
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Logs des dernières 50 lignes :"
echo "================================"
docker-compose -f docker-compose.test.yml logs --tail=50

# Status final
echo ""
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Status détaillé avec Supabase :"
echo "=================================="
curl -s http://localhost:3000/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/health

echo ""
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Test de connexion Supabase :"
echo "==========================================="
# Test spécifique de la connexion Supabase
docker exec sentineliq-harvest-test node -e "
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
if (supabaseUrl && supabaseKey) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Client Supabase créé avec succès');
  console.log('🔗 URL:', supabaseUrl);
} else {
  console.log('❌ Variables Supabase manquantes');
}
" 2>/dev/null || echo "⚠️ Test client Supabase non disponible"

echo ""
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Container en cours d'exécution avec Supabase."
echo "Commandes utiles :"
echo "  📊 Voir les logs en temps réel : docker-compose -f docker-compose.test.yml logs -f"
echo "  🔍 Inspecter le container : docker exec -it sentineliq-harvest-test sh"
echo "  ⚙️ Tester un endpoint : curl http://localhost:3000/health"
echo "  🗄️ Test Supabase : curl http://localhost:3000/ready"
echo "  🛑 Arrêter le test : docker-compose -f docker-compose.test.yml down"
