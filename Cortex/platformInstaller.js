#!/usr/bin/env node

/**
 * 🛠️ Script d'installation automatique des dépendances Cortex
 * Détecte la plateforme et installe les bonnes dépendances
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { logger } from '../utils/logger.js';

class PlatformInstaller {
    constructor() {
        this.platform = process.platform;
        this.isRoot = process.getuid && process.getuid() === 0;
    }

    /**
     * 🚀 Installation automatique selon la plateforme
     */
    async install() {
        logger.info(`🛠️ Installation des dépendances Cortex pour ${this.platform}`, 'PlatformInstaller');

        try {
            await this.detectDistribution();
            await this.installSystemDependencies();
            await this.verifyInstallation();

            logger.success('✅ Installation terminée avec succès', 'PlatformInstaller');

        } catch (error) {
            logger.error(`❌ Erreur d'installation: ${error.message}`, 'PlatformInstaller');
            throw error;
        }
    }

    /**
     * 🔍 Détection de la distribution Linux
     */
    async detectDistribution() {
        if (this.platform !== 'linux') {
            logger.info(`📋 Plateforme détectée: ${this.platform}`, 'PlatformInstaller');
            return;
        }

        try {
            if (existsSync('/etc/os-release')) {
                const osRelease = readFileSync('/etc/os-release', 'utf8');

                if (osRelease.includes('debian') || osRelease.includes('ubuntu')) {
                    this.distribution = 'debian';
                    logger.info('📋 Distribution détectée: Debian/Ubuntu', 'PlatformInstaller');
                } else if (osRelease.includes('centos') || osRelease.includes('rhel') || osRelease.includes('fedora')) {
                    this.distribution = 'redhat';
                    logger.info('📋 Distribution détectée: RedHat/CentOS/Fedora', 'PlatformInstaller');
                } else {
                    this.distribution = 'linux';
                    logger.info('📋 Distribution Linux générique détectée', 'PlatformInstaller');
                }
            }
        } catch (error) {
            logger.warn(`⚠️ Impossible de détecter la distribution: ${error.message}`, 'PlatformInstaller');
            this.distribution = 'linux';
        }
    }

    /**
     * 📦 Installation des dépendances système
     */
    async installSystemDependencies() {
        switch (this.platform) {
            case 'darwin':
                await this.installMacOSDependencies();
                break;
            case 'linux':
                await this.installLinuxDependencies();
                break;
            default:
                logger.warn(`⚠️ Plateforme ${this.platform} non supportée automatiquement`, 'PlatformInstaller');
        }
    }

    /**
     * 🍎 Installation des dépendances macOS
     */
    async installMacOSDependencies() {
        logger.info('🍎 Installation des dépendances macOS', 'PlatformInstaller');

        try {
            // Vérification de Homebrew
            try {
                execSync('which brew', { stdio: 'pipe' });
                logger.info('✅ Homebrew détecté', 'PlatformInstaller');
            } catch (error) {
                logger.warn('⚠️ Homebrew non trouvé, installation...', 'PlatformInstaller');
                const homebrewInstall = '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';
                execSync(homebrewInstall, { stdio: 'inherit' });
            }

            // Installation de Chromium
            try {
                execSync('brew list chromium', { stdio: 'pipe' });
                logger.info('✅ Chromium déjà installé', 'PlatformInstaller');
            } catch (error) {
                logger.info('📦 Installation de Chromium...', 'PlatformInstaller');
                execSync('brew install chromium', { stdio: 'inherit' });
            }

        } catch (error) {
            logger.error(`❌ Erreur installation macOS: ${error.message}`, 'PlatformInstaller');
            this.suggestManualInstallation('macOS');
        }
    }

    /**
     * 🐧 Installation des dépendances Linux
     */
    async installLinuxDependencies() {
        logger.info(`🐧 Installation des dépendances Linux (${this.distribution})`, 'PlatformInstaller');

        switch (this.distribution) {
            case 'debian':
                await this.installDebianDependencies();
                break;
            case 'redhat':
                await this.installRedHatDependencies();
                break;
            default:
                logger.warn('⚠️ Distribution Linux non reconnue, essai générique', 'PlatformInstaller');
                await this.installGenericLinuxDependencies();
        }
    }

    /**
     * 📦 Installation des dépendances Debian/Ubuntu
     */
    async installDebianDependencies() {
        try {
            if (!this.isRoot) {
                logger.warn('⚠️ Droits administrateur requis pour l\'installation', 'PlatformInstaller');
                logger.info('💡 Exécutez: sudo npm run cortex:install', 'PlatformInstaller');
                return;
            }

            // Mise à jour des paquets
            logger.info('🔄 Mise à jour de la liste des paquets...', 'PlatformInstaller');
            execSync('apt-get update', { stdio: 'inherit' });

            // Installation des dépendances
            const packages = [
                'chromium-browser',
                'fonts-liberation',
                'libasound2',
                'libatk-bridge2.0-0',
                'libdrm2',
                'libgtk-3-0',
                'libgtk-4-1',
                'libnss3',
                'xdg-utils'
            ];

            logger.info(`📦 Installation des paquets: ${packages.join(', ')}`, 'PlatformInstaller');
            execSync(`apt-get install -y ${packages.join(' ')}`, { stdio: 'inherit' });

        } catch (error) {
            logger.error(`❌ Erreur installation Debian: ${error.message}`, 'PlatformInstaller');
            this.suggestManualInstallation('Debian/Ubuntu');
        }
    }

    /**
     * 🎩 Installation des dépendances RedHat/CentOS/Fedora
     */
    async installRedHatDependencies() {
        try {
            if (!this.isRoot) {
                logger.warn('⚠️ Droits administrateur requis pour l\'installation', 'PlatformInstaller');
                logger.info('💡 Exécutez: sudo npm run cortex:install', 'PlatformInstaller');
                return;
            }

            // Détection du gestionnaire de paquets
            let packageManager = 'yum';
            try {
                execSync('which dnf', { stdio: 'pipe' });
                packageManager = 'dnf';
            } catch (error) {
                // yum par défaut
            }

            const packages = [
                'chromium',
                'liberation-fonts',
                'alsa-lib',
                'atk',
                'gtk3',
                'nss'
            ];

            logger.info(`📦 Installation avec ${packageManager}: ${packages.join(', ')}`, 'PlatformInstaller');
            execSync(`${packageManager} install -y ${packages.join(' ')}`, { stdio: 'inherit' });

        } catch (error) {
            logger.error(`❌ Erreur installation RedHat: ${error.message}`, 'PlatformInstaller');
            this.suggestManualInstallation('RedHat/CentOS/Fedora');
        }
    }

    /**
     * 🔧 Installation générique Linux
     */
    async installGenericLinuxDependencies() {
        logger.warn('⚠️ Installation automatique non supportée pour cette distribution', 'PlatformInstaller');
        this.suggestManualInstallation('Linux générique');
    }

    /**
     * ✅ Vérification de l'installation
     */
    async verifyInstallation() {
        logger.info('🔍 Vérification de l\'installation...', 'PlatformInstaller');

        const chromiumPaths = [
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            '/opt/homebrew/bin/chromium'
        ];

        let chromiumFound = false;
        for (const path of chromiumPaths) {
            if (existsSync(path)) {
                logger.success(`✅ Chromium trouvé: ${path}`, 'PlatformInstaller');
                chromiumFound = true;
                break;
            }
        }

        if (!chromiumFound) {
            logger.warn('⚠️ Chromium non trouvé dans les emplacements standards', 'PlatformInstaller');
            logger.info('💡 Puppeteer essaiera d\'utiliser sa version intégrée', 'PlatformInstaller');
        }

        // Test de Node.js et npm
        try {
            const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
            const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();

            logger.success(`✅ Node.js: ${nodeVersion}`, 'PlatformInstaller');
            logger.success(`✅ npm: ${npmVersion}`, 'PlatformInstaller');
        } catch (error) {
            logger.error('❌ Node.js ou npm non trouvé', 'PlatformInstaller');
        }
    }

    /**
     * 💡 Suggestions d'installation manuelle
     */
    suggestManualInstallation(platform) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`💡 INSTALLATION MANUELLE POUR ${platform.toUpperCase()}`);
        console.log(`${'='.repeat(60)}`);

        switch (platform.toLowerCase()) {
            case 'macos':
                console.log('🍎 macOS:');
                console.log('   1. Installez Homebrew: https://brew.sh/');
                console.log('   2. brew install chromium');
                console.log('   3. Ou téléchargez Chrome: https://www.google.com/chrome/');
                break;

            case 'debian/ubuntu':
                console.log('🐧 Debian/Ubuntu:');
                console.log('   sudo apt-get update');
                console.log('   sudo apt-get install chromium-browser');
                console.log('   # Ou pour Google Chrome:');
                console.log('   wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -');
                console.log('   sudo sh -c \'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list\'');
                console.log('   sudo apt-get update && sudo apt-get install google-chrome-stable');
                break;

            case 'redhat/centos/fedora':
                console.log('🎩 RedHat/CentOS/Fedora:');
                console.log('   # Pour Fedora:');
                console.log('   sudo dnf install chromium');
                console.log('   # Pour CentOS/RHEL:');
                console.log('   sudo yum install chromium');
                break;

            default:
                console.log('🔧 Installez un navigateur Chromium compatible:');
                console.log('   - chromium-browser');
                console.log('   - google-chrome');
                console.log('   - google-chrome-stable');
        }

        console.log(`\n📋 Variables d'environnement optionnelles:`);
        console.log('   export PUPPETEER_EXECUTABLE_PATH=/chemin/vers/chromium');
        console.log(`${'='.repeat(60)}\n`);
    }
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
    const installer = new PlatformInstaller();

    try {
        await installer.install();
        process.exit(0);
    } catch (error) {
        console.error('❌ Installation échouée:', error.message);
        process.exit(1);
    }
}

export { PlatformInstaller };
