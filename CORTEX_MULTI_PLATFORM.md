# 🚀 Cortex - Guide Multi-Plateforme

## 🖥️ Compatibilité

Cortex est optimisé pour fonctionner sur **macOS** et **Debian/Linux** avec des configurations automatiques spécifiques à chaque plateforme.

### Plateformes Supportées

| Plateforme                  | Status           | Optimisations                        |
| --------------------------- | ---------------- | ------------------------------------ |
| 🍎 **macOS**                | ✅ Full Support  | Pool de 3 navigateurs, 1GB mémoire   |
| 🐧 **Debian/Ubuntu**        | ✅ Full Support  | Pool de 2 navigateurs, 512MB mémoire |
| 🎩 **RedHat/CentOS/Fedora** | ⚡ Basic Support | Configuration générique              |
| 🐧 **Linux Générique**      | ⚡ Basic Support | Configuration conservative           |

## 🛠️ Installation

### Installation Automatique

```bash
# Installation des dépendances système selon la plateforme
npm run cortex:install

# Test de compatibilité
npm run cortex:test

# Lancement de Cortex
npm run cortex
```

### Installation Manuelle

#### 🍎 macOS

```bash
# Avec Homebrew (recommandé)
brew install chromium

# Ou télécharger Chrome
# https://www.google.com/chrome/
```

#### 🐧 Debian/Ubuntu

```bash
# Chromium (recommandé)
sudo apt-get update
sudo apt-get install chromium-browser

# Ou Google Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt-get update && sudo apt-get install google-chrome-stable
```

#### 🎩 RedHat/CentOS/Fedora

```bash
# Fedora
sudo dnf install chromium

# CentOS/RHEL
sudo yum install chromium
```

## ⚙️ Configuration

### Variables d'Environnement

```bash
# Chemin personnalisé vers Chromium (optionnel)
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Niveau de logging Cortex
export CORTEX_LOG_LEVEL=INFO

# Monitoring des performances
export ENABLE_CORTEX_PERF_LOGS=true
export ENABLE_CORTEX_MEM_MONITOR=true
```

### Configuration Automatique par Plateforme

#### 🍎 macOS - Configuration

```javascript
{
  "browserPoolSize": 3,
  "maxConcurrentPages": 5,
  "maxMemoryUsage": "1GB",
  "timeout": 30000,
  "retryAttempts": 3,
  "concurrentRequests": 10
}
```

#### 🐧 Debian/Linux - Configuration

```javascript
{
  "browserPoolSize": 2,
  "maxConcurrentPages": 3,
  "maxMemoryUsage": "512MB",
  "timeout": 45000,
  "retryAttempts": 5,
  "concurrentRequests": 5
}
```

## 🧪 Tests et Diagnostic

### Suite de Tests Complète

```bash
# Tests de compatibilité multi-plateforme
npm run cortex:test

# Test de performance spécifique
npm run cortex:test-platform
```

### Diagnostic Manuel

```bash
# Vérification de la détection de plateforme
node -e "
import('./Cortex/config.js').then(async ({ detectPlatform }) => {
  const config = await detectPlatform();
  console.log('Plateforme:', config.IS_MACOS ? 'macOS' : config.IS_DEBIAN ? 'Debian' : 'Linux');
  console.log('Chromium:', config.PUPPETEER.DEBIAN.executablePath || 'Auto-détecté');
});
"

# Test de création de navigateur
node -e "
import('./Cortex/puppeteerManager.js').then(async ({ puppeteerManager }) => {
  try {
    await puppeteerManager.initialize();
    const browser = await puppeteerManager.createBrowser();
    console.log('✅ Navigateur créé avec succès');
    await browser.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
});
"
```

## 🔧 Dépannage

### Problèmes Fréquents

#### ❌ "Cannot find package 'puppeteer'"

```bash
npm install puppeteer
```

#### ❌ "Chromium executable not found"

```bash
# Debian/Ubuntu
sudo apt-get install chromium-browser

# macOS
brew install chromium

# Ou définir le chemin manuellement
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

#### ❌ "Protocol error: Target closed"

```bash
# Augmenter les timeouts pour les serveurs lents
export CORTEX_TIMEOUT=60000

# Réduire la concurrence
export CORTEX_MAX_CONCURRENT=2
```

#### ❌ "Memory pressure" sur Debian

```bash
# Activer le mode économie de mémoire
export CORTEX_MEMORY_MODE=conservative

# Ou réduire le pool de navigateurs
export CORTEX_BROWSER_POOL_SIZE=1
```

### Logs de Diagnostic

```bash
# Logs détaillés
export CORTEX_LOG_LEVEL=DEBUG
export ENABLE_CORTEX_PERF_LOGS=true

# Monitoring mémoire
export ENABLE_CORTEX_MEM_MONITOR=true

# Logs de scraping
export ENABLE_SCRAPING_LOGS=true
```

## 📊 Monitoring et Performance

### Métriques par Plateforme

#### 🍎 macOS - Performance Typique

- **Navigateurs concurrents**: 3
- **Pages par navigateur**: 5
- **Mémoire utilisée**: ~800MB
- **Temps de scraping**: ~2-5s par article
- **Débit**: 50-100 articles/minute

#### 🐧 Debian/Linux - Performance Typique

- **Navigateurs concurrents**: 2
- **Pages par navigateur**: 3
- **Mémoire utilisée**: ~400MB
- **Temps de scraping**: ~3-8s par article
- **Débit**: 20-50 articles/minute

### Optimisations Avancées

#### Pour les Serveurs Debian/Ubuntu

```bash
# Optimisations système
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf

# Limites de fichiers ouverts
echo '* soft nofile 65536' | sudo tee -a /etc/security/limits.conf
echo '* hard nofile 65536' | sudo tee -a /etc/security/limits.conf
```

#### Pour macOS

```bash
# Augmenter les limites de processus
sudo launchctl limit maxproc 2048 2048

# Optimisation réseau
sudo sysctl -w net.inet.tcp.delayed_ack=0
```

## 🐳 Docker et Conteneurs

### Dockerfile pour Debian

```dockerfile
FROM debian:12-slim

# Installation des dépendances Cortex
RUN apt-get update && apt-get install -y \\
    chromium-browser \\
    fonts-liberation \\
    libasound2 \\
    libatk-bridge2.0-0 \\
    libdrm2 \\
    libgtk-3-0 \\
    libnss3 \\
    nodejs \\
    npm

# Variables d'environnement optimisées pour conteneur
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV CORTEX_BROWSER_POOL_SIZE=1
ENV CORTEX_MAX_CONCURRENT=2
ENV CORTEX_MEMORY_MODE=conservative

WORKDIR /app
COPY . .
RUN npm install

CMD ["npm", "run", "cortex"]
```

### Docker Compose

```yaml
version: "3.8"
services:
  cortex:
    build: .
    environment:
      - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
      - CORTEX_LOG_LEVEL=INFO
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

## 🚀 Scripts Utiles

### Lancement avec Monitoring

```bash
#!/bin/bash
# launch-cortex-monitor.sh

echo "🚀 Lancement de Cortex avec monitoring..."

# Configuration selon la plateforme
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Configuration macOS"
    export CORTEX_BROWSER_POOL_SIZE=3
    export CORTEX_MAX_CONCURRENT=5
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Configuration Linux"
    export CORTEX_BROWSER_POOL_SIZE=2
    export CORTEX_MAX_CONCURRENT=3
fi

# Activation du monitoring
export ENABLE_CORTEX_PERF_LOGS=true
export ENABLE_CORTEX_MEM_MONITOR=true

# Test de compatibilité
npm run cortex:test

# Lancement si les tests passent
if [ $? -eq 0 ]; then
    echo "✅ Tests réussis, lancement de Cortex..."
    npm run cortex
else
    echo "❌ Tests échoués, vérifiez la configuration"
    exit 1
fi
```

### Surveillance Continue

```bash
#!/bin/bash
# monitor-cortex.sh

while true; do
    echo "$(date): Surveillance Cortex..."

    # Vérification des processus
    ps aux | grep cortex | grep -v grep

    # Vérification mémoire
    free -h

    # Attente
    sleep 60
done
```

## 📚 API et Intégration

### Utilisation Programmatique

```javascript
import { puppeteerManager } from "./Cortex/puppeteerManager.js";
import { scrapingEngine } from "./Cortex/scrapingEngine.js";

// Initialisation
await puppeteerManager.initialize();
await scrapingEngine.initialize();

// Scraping d'une URL
const result = await scrapingEngine.scrapUrl("https://example.com");

// Nettoyage
await puppeteerManager.cleanup();
```

### Intégration avec WireScanner

```javascript
// Le système WireScanner détecte automatiquement Cortex
// et utilise la configuration multi-plateforme appropriée

import { wireScanner } from "./WireScanner/start.js";

const results = await wireScanner.run({
  enableCortexIntegration: true,
  platformOptimization: true,
});
```

---

## 📞 Support

Pour des problèmes spécifiques à une plateforme :

- **macOS** : Vérifiez Homebrew et les permissions
- **Debian/Ubuntu** : Vérifiez les paquets système et les droits sudo
- **RedHat/CentOS** : Vérifiez les repositories EPEL
- **Docker** : Utilisez `--no-sandbox` et `--disable-dev-shm-usage`

🔗 **Documentation complète** : Voir `GUIDE_COMPLET_JUNIOR.md` pour plus de détails.
