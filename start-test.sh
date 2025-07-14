#!/bin/bash

# 🚀 LANCEMENT RAPIDE - Test Local Coolify
echo "🚀 Lancement du test local avec conditions Coolify..."

# Vérifier que Docker est lancé
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas lancé. Veuillez démarrer Docker Desktop."
    exit 1
fi

# Variables Supabase (modifie ces valeurs avec tes vraies clés)
echo "⚠️  IMPORTANT: As-tu configuré tes variables Supabase dans docker-compose.test.yml ?"
echo "   - SUPABASE_URL=ton_url_supabase"
echo "   - SUPABASE_ANON_KEY=ta_clé_supabase"
echo ""
read -p "Continuer ? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "👉 Édite docker-compose.test.yml pour configurer Supabase avant de continuer."
    exit 1
fi

# Lancer le test complet
./test-local-coolify.sh
