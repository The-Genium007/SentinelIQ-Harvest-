#!/usr/bin/env node

/**
 * 🧪 Script de test Cortex multi-plateforme
 * Teste la compatibilité Debian et macOS
 */

import { logger } from '../utils/logger.js';
import { puppeteerManager } from './puppeteerManager.js';
import { scrapingEngine } from './scrapingEngine.js';

class CortexPlatformTester {
    constructor() {
        this.testResults = {
            platform: null,
            puppeteerManager: false,
            scrapingEngine: false,
            browserCreation: false,
            pageNavigation: false,
            contentExtraction: false,
            performance: {}
        };
    }

    /**
     * 🚀 Lance la suite de tests complète
     */
    async runAllTests() {
        logger.info('🧪 Démarrage des tests multi-plateforme Cortex', 'PlatformTester');

        try {
            await this.testPlatformDetection();
            await this.testPuppeteerManager();
            await this.testScrapingEngine();
            await this.testBrowserCreation();
            await this.testPageNavigation();
            await this.testContentExtraction();
            await this.testPerformance();

            this.displayResults();
            return this.testResults;

        } catch (error) {
            logger.error(`❌ Erreur durant les tests: ${error.message}`, 'PlatformTester');
            throw error;
        }
    }

    /**
     * 🖥️ Test de détection de plateforme
     */
    async testPlatformDetection() {
        logger.info('📋 Test 1/6: Détection de plateforme', 'PlatformTester');

        try {
            const config = await puppeteerManager.initialize();

            this.testResults.platform = {
                os: process.platform,
                isLinux: config.IS_LINUX,
                isMacOS: config.IS_MACOS,
                isDebian: config.IS_DEBIAN,
                detected: config.IS_MACOS ? 'macOS' : config.IS_DEBIAN ? 'Debian/Linux' : 'Linux générique'
            };

            logger.success(`✅ Plateforme détectée: ${this.testResults.platform.detected}`, 'PlatformTester');

        } catch (error) {
            logger.error(`❌ Échec détection plateforme: ${error.message}`, 'PlatformTester');
            throw error;
        }
    }

    /**
     * 🎛️ Test du gestionnaire Puppeteer
     */
    async testPuppeteerManager() {
        logger.info('📋 Test 2/6: Gestionnaire Puppeteer', 'PlatformTester');

        try {
            const stats = puppeteerManager.getStats();

            if (!stats.isInitialized) {
                throw new Error('PuppeteerManager non initialisé');
            }

            this.testResults.puppeteerManager = true;
            logger.success(`✅ PuppeteerManager opérationnel (${stats.platform})`, 'PlatformTester');

        } catch (error) {
            logger.error(`❌ Échec gestionnaire Puppeteer: ${error.message}`, 'PlatformTester');
            throw error;
        }
    }

    /**
     * 🕷️ Test du moteur de scraping
     */
    async testScrapingEngine() {
        logger.info('📋 Test 3/6: Moteur de scraping', 'PlatformTester');

        try {
            await scrapingEngine.initialize();

            this.testResults.scrapingEngine = true;
            logger.success('✅ Moteur de scraping initialisé', 'PlatformTester');

        } catch (error) {
            logger.error(`❌ Échec moteur de scraping: ${error.message}`, 'PlatformTester');
            throw error;
        }
    }

    /**
     * 🌐 Test de création de navigateur
     */
    async testBrowserCreation() {
        logger.info('📋 Test 4/6: Création de navigateur', 'PlatformTester');

        try {
            const browser = await puppeteerManager.createBrowser();

            if (!browser || typeof browser.close !== 'function') {
                throw new Error('Navigateur invalide créé');
            }

            await browser.close();

            this.testResults.browserCreation = true;
            logger.success('✅ Création de navigateur réussie', 'PlatformTester');

        } catch (error) {
            logger.error(`❌ Échec création navigateur: ${error.message}`, 'PlatformTester');

            // Conseils selon la plateforme
            if (this.testResults.platform?.isDebian) {
                logger.warn('💡 Essayez: sudo apt-get install chromium-browser', 'PlatformTester');
            } else if (this.testResults.platform?.isMacOS) {
                logger.warn('💡 Essayez: brew install chromium', 'PlatformTester');
            }

            throw error;
        }
    }

    /**
     * 📄 Test de navigation de page
     */
    async testPageNavigation() {
        logger.info('📋 Test 5/6: Navigation de page', 'PlatformTester');

        const startTime = Date.now();
        let browser = null;
        let page = null;

        try {
            browser = await puppeteerManager.createBrowser();
            page = await puppeteerManager.createOptimizedPage(browser);

            // Test avec une page simple
            await page.goto('data:text/html,<html><head><title>Test Cortex</title></head><body><h1>Cortex Platform Test</h1><p>Navigation test successful</p></body></html>', {
                waitUntil: 'networkidle0',
                timeout: 10000
            });

            const title = await page.title();
            if (title !== 'Test Cortex') {
                throw new Error(`Titre incorrect: ${title}`);
            }

            const navigationTime = Date.now() - startTime;

            this.testResults.pageNavigation = true;
            this.testResults.performance.navigationTime = navigationTime;
            logger.success(`✅ Navigation réussie (${navigationTime}ms)`, 'PlatformTester');

        } catch (error) {
            logger.error(`❌ Échec navigation: ${error.message}`, 'PlatformTester');
            throw error;
        } finally {
            if (page) await page.close();
            if (browser) await browser.close();
        }
    }

    /**
     * 📝 Test d'extraction de contenu
     */
    async testContentExtraction() {
        logger.info('📋 Test 6/6: Extraction de contenu', 'PlatformTester');

        const startTime = Date.now();
        let browser = null;
        let page = null;

        try {
            browser = await puppeteerManager.createBrowser();
            page = await puppeteerManager.createOptimizedPage(browser);

            // Page de test avec contenu structuré
            const testHtml = `
                <html>
                <head><title>Article Test</title></head>
                <body>
                    <article>
                        <h1>Titre de l'article de test</h1>
                        <p>Premier paragraphe de contenu.</p>
                        <p>Deuxième paragraphe avec plus de contenu pour tester l'extraction.</p>
                        <div class="metadata">
                            <span class="author">Auteur Test</span>
                            <time datetime="2025-07-13">13 juillet 2025</time>
                        </div>
                    </article>
                </body>
                </html>
            `;

            await page.goto(`data:text/html,${encodeURIComponent(testHtml)}`, {
                waitUntil: 'networkidle0',
                timeout: 10000
            });

            // Test d'extraction
            const extractedContent = await page.evaluate(() => {
                const title = document.querySelector('h1')?.textContent?.trim();
                const content = Array.from(document.querySelectorAll('p'))
                    .map(p => p.textContent?.trim())
                    .filter(text => text);
                const author = document.querySelector('.author')?.textContent?.trim();

                return { title, content, author };
            });

            // Validation des résultats
            if (!extractedContent.title || extractedContent.title !== 'Titre de l\'article de test') {
                throw new Error(`Titre extrait incorrect: ${extractedContent.title}`);
            }

            if (!extractedContent.content || extractedContent.content.length !== 2) {
                throw new Error(`Contenu extrait incorrect: ${extractedContent.content?.length} paragraphes`);
            }

            if (!extractedContent.author || extractedContent.author !== 'Auteur Test') {
                throw new Error(`Auteur extrait incorrect: ${extractedContent.author}`);
            }

            const extractionTime = Date.now() - startTime;

            this.testResults.contentExtraction = true;
            this.testResults.performance.extractionTime = extractionTime;
            logger.success(`✅ Extraction de contenu réussie (${extractionTime}ms)`, 'PlatformTester');

        } catch (error) {
            logger.error(`❌ Échec extraction contenu: ${error.message}`, 'PlatformTester');
            throw error;
        } finally {
            if (page) await page.close();
            if (browser) await browser.close();
        }
    }

    /**
     * ⚡ Test de performance
     */
    async testPerformance() {
        logger.info('📊 Test de performance globale', 'PlatformTester');

        const startTime = Date.now();
        const memUsage = process.memoryUsage();

        this.testResults.performance.memoryUsage = {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024)
        };

        const totalTime = Date.now() - startTime;
        this.testResults.performance.totalTestTime = totalTime;

        logger.success(`✅ Tests complétés en ${totalTime}ms`, 'PlatformTester');
    }

    /**
     * 📊 Affichage des résultats
     */
    displayResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 RÉSULTATS DES TESTS CORTEX MULTI-PLATEFORME');
        console.log('='.repeat(60));

        console.log(`\n🖥️  PLATEFORME DÉTECTÉE: ${this.testResults.platform?.detected}`);
        console.log(`   OS: ${this.testResults.platform?.os}`);
        console.log(`   Linux: ${this.testResults.platform?.isLinux ? '✅' : '❌'}`);
        console.log(`   macOS: ${this.testResults.platform?.isMacOS ? '✅' : '❌'}`);
        console.log(`   Debian: ${this.testResults.platform?.isDebian ? '✅' : '❌'}`);

        console.log('\n🔧 COMPOSANTS:');
        console.log(`   PuppeteerManager: ${this.testResults.puppeteerManager ? '✅' : '❌'}`);
        console.log(`   ScrapingEngine: ${this.testResults.scrapingEngine ? '✅' : '❌'}`);
        console.log(`   Création navigateur: ${this.testResults.browserCreation ? '✅' : '❌'}`);
        console.log(`   Navigation page: ${this.testResults.pageNavigation ? '✅' : '❌'}`);
        console.log(`   Extraction contenu: ${this.testResults.contentExtraction ? '✅' : '❌'}`);

        if (this.testResults.performance) {
            console.log('\n⚡ PERFORMANCE:');
            if (this.testResults.performance.navigationTime) {
                console.log(`   Navigation: ${this.testResults.performance.navigationTime}ms`);
            }
            if (this.testResults.performance.extractionTime) {
                console.log(`   Extraction: ${this.testResults.performance.extractionTime}ms`);
            }
            if (this.testResults.performance.memoryUsage) {
                const mem = this.testResults.performance.memoryUsage;
                console.log(`   Mémoire utilisée: ${mem.heapUsed}MB / ${mem.heapTotal}MB`);
            }
        }

        const allPassed = this.testResults.puppeteerManager &&
            this.testResults.scrapingEngine &&
            this.testResults.browserCreation &&
            this.testResults.pageNavigation &&
            this.testResults.contentExtraction;

        console.log(`\n🎯 RÉSULTAT GLOBAL: ${allPassed ? '✅ TOUS LES TESTS RÉUSSIS' : '❌ CERTAINS TESTS ONT ÉCHOUÉ'}`);
        console.log('='.repeat(60) + '\n');
    }

    /**
     * 🧹 Nettoyage des ressources
     */
    async cleanup() {
        try {
            await puppeteerManager.cleanup();
            await scrapingEngine.cleanup();
        } catch (error) {
            logger.error(`Erreur durant le nettoyage: ${error.message}`, 'PlatformTester');
        }
    }
}

// Exécution si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new CortexPlatformTester();

    try {
        await tester.runAllTests();
        process.exit(0);
    } catch (error) {
        console.error('❌ Tests échoués:', error.message);
        process.exit(1);
    } finally {
        await tester.cleanup();
    }
}

export { CortexPlatformTester };
