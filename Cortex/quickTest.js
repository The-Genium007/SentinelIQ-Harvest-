#!/usr/bin/env node

/**
 * 🧪 Test rapide de Cortex
 * Diagnostic simple pour identifier les blocages
 */

console.log('🚀 Test de démarrage Cortex...');

try {
    console.log('📋 Étape 1: Import du logger...');
    const { logger } = await import('../utils/logger.js');
    console.log('✅ Logger importé');

    console.log('📋 Étape 2: Import de la configuration...');
    const { SCRAPING_CONFIG, PERFORMANCE_CONFIG } = await import('./config.js');
    console.log('✅ Configuration importée');

    console.log('📋 Étape 3: Test du PuppeteerManager...');
    const { puppeteerManager } = await import('./puppeteerManager.js');
    console.log('✅ PuppeteerManager importé');

    console.log('📋 Étape 4: Initialisation PuppeteerManager...');
    await puppeteerManager.initialize();
    console.log('✅ PuppeteerManager initialisé');

    console.log('📋 Étape 5: Test création navigateur...');
    const browser = await puppeteerManager.createBrowser();
    console.log('✅ Navigateur créé');

    console.log('📋 Étape 6: Test simple de page...');
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>Test Cortex</h1>');
    const title = await page.evaluate(() => document.querySelector('h1').textContent);
    await page.close();
    await browser.close();

    if (title === 'Test Cortex') {
        console.log('✅ Test complet réussi !');
        console.log('🎉 Cortex est opérationnel');
    } else {
        console.log('❌ Test échoué:', title);
    }

} catch (error) {
    console.error('❌ Erreur durant le test:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}

console.log('🏁 Test terminé');
process.exit(0);
