#!/bin/bash

# 🚀 LANCEMENT RAPIDE - Test Local Coolify avec OrbStack
echo "🚀 Lancement du test local avec conditions Coolify (OrbStack)..."

# Vérifier que OrbStack est lancé
if ! docker info > /dev/null 2>&1; then
    echo "❌ OrbStack n'est pas lancé ou Docker non disponible."
    echo ""
    echo "💡 SOLUTIONS :"
    echo "   1. Lance d'abord OrbStack : ./start-orbstack.sh"
    echo "   2. Ou lance manuellement OrbStack depuis les Applications"
    echo "   3. Vérifie que l'icône OrbStack est active dans la barre de menu"
    echo ""
    echo "🔧 Pour installer OrbStack : https://orbstack.dev/"
    echo "🔧 Pour vérifier : docker --version"
    exit 1
fi

echo "✅ OrbStack détecté et fonctionnel"
docker --version

# Variables Supabase (modifie ces valeurs avec tes vraies clés)
echo ""
echo "⚠️  IMPORTANT: As-tu configuré tes variables Supabase dans docker-compose.test.yml ?"
echo "   - SUPABASE_URL=ton_url_supabase"
echo "   - SUPABASE_ANON_KEY=ta_clé_supabase"
echo ""
echo "📝 Pour éditer : nano docker-compose.test.yml"
echo ""
read -p "Continuer avec la configuration actuelle ? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "👉 Configure d'abord Supabase dans docker-compose.test.yml"
    echo "📝 Utilise: nano docker-compose.test.yml"
    echo "🔍 Cherche les lignes SUPABASE_URL et SUPABASE_ANON_KEY"
    exit 1
fi

# Lancer le test complet
echo "🐳 Lancement du test avec OrbStack..."
./test-local-coolify.sh
