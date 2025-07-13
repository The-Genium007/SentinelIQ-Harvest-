#!/bin/sh

# Script de healthcheck pour SentinelIQ Harvest
# Vérifie que le serveur est opérationnel sur le port 3000

PORT=${PORT:-3000}
TIMEOUT=5

# Fonction de log
log() {
    echo "[HEALTHCHECK] $(date '+%Y-%m-%d %H:%M:%S') $1"
}

# Test de connectivité basique
test_connection() {
    if command -v curl >/dev/null 2>&1; then
        # Utilise curl si disponible
        curl --silent --fail --max-time $TIMEOUT http://127.0.0.1:$PORT/health >/dev/null 2>&1
        return $?
    elif command -v wget >/dev/null 2>&1; then
        # Utilise wget si curl n'est pas disponible
        wget --quiet --timeout=$TIMEOUT --tries=1 -O /dev/null http://127.0.0.1:$PORT/health >/dev/null 2>&1
        return $?
    else
        # Test basique avec netcat si disponible
        if command -v nc >/dev/null 2>&1; then
            nc -z 127.0.0.1 $PORT
            return $?
        else
            log "❌ Aucun outil de test disponible (curl, wget, nc)"
            return 1
        fi
    fi
}

# Test principal
if test_connection; then
    log "✅ Service healthy - port $PORT accessible"
    exit 0
else
    log "❌ Service unhealthy - port $PORT inaccessible"
    exit 1
fi
