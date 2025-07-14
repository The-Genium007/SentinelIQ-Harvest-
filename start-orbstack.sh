#!/bin/bash

echo "🔧 HELPER - Démarrage OrbStack pour test local"
echo "============================================="

# Vérifier si OrbStack est installé
if ! command -v orb &> /dev/null && ! ls /Applications/OrbStack.app &> /dev/null 2>&1; then
    echo "❌ OrbStack n'est pas installé."
    echo ""
    echo "💡 INSTALLATION ORBSTACK :"
    echo "   1. Va sur : https://orbstack.dev/"
    echo "   2. Télécharge OrbStack pour macOS"
    echo "   3. Installe l'application"
    echo "   4. Lance OrbStack depuis les Applications"
    echo ""
    echo "🚀 Ou installe avec Homebrew :"
    echo "   brew install orbstack"
    exit 1
fi

# Vérifier si OrbStack est déjà lancé
if docker info > /dev/null 2>&1; then
    echo "✅ OrbStack est déjà lancé et fonctionnel"
    docker --version
    echo "🐳 Docker via OrbStack opérationnel"
    exit 0
fi

echo "🚀 Lancement d'OrbStack..."

# Essayer différentes méthodes de lancement
if ls /Applications/OrbStack.app &> /dev/null; then
    # Lancer via l'application
    echo "📱 Lancement via /Applications/OrbStack.app..."
    open -a OrbStack
elif command -v orb &> /dev/null; then
    # Lancer via la commande orb
    echo "⚡ Lancement via commande 'orb'..."
    orb start
else
    echo "❌ Impossible de trouver OrbStack"
    exit 1
fi

echo "⏳ Attente du démarrage d'OrbStack (15 secondes)..."
sleep 15

# Vérifier plusieurs fois avec timeout
for i in {1..6}; do
    echo "🔍 Tentative de connexion Docker $i/6..."
    if docker info > /dev/null 2>&1; then
        echo "✅ OrbStack lancé avec succès !"
        docker --version
        echo "🐳 Docker engine via OrbStack prêt"
        echo ""
        echo "🎯 Tu peux maintenant lancer : ./start-test.sh"
        exit 0
    fi
    sleep 5
done

echo "⚠️ OrbStack prend plus de temps à démarrer..."
echo "💡 Solutions :"
echo "   • Attends 1-2 minutes puis réessaie : ./start-test.sh"
echo "   • Ou lance OrbStack manuellement depuis le Finder"
echo "   • Vérifie dans la barre de menu si OrbStack est actif"
