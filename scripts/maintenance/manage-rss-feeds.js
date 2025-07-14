#!/usr/bin/env node

/**
 * 🔧 Utilitaire de gestion des flux RSS invalides
 * Permet de consulter, marquer et réhabiliter les flux RSS
 */

import { rssRepository } from '../../database/rssRepository.js';
import { logManager } from '../../utils/logManager.js';

const args = process.argv.slice(2);
const command = args[0];

/**
 * Affiche l'aide
 */
function showHelp() {
    console.log(`
🔧 Utilitaire de gestion des flux RSS invalides

Usage:
  node manage-rss-feeds.js <command> [options]

Commandes:
  list                    Liste tous les flux (valides et invalides)
  list-invalid           Liste uniquement les flux invalides
  list-valid             Liste uniquement les flux valides
  mark-invalid <url>     Marque un flux comme invalide
  mark-valid <url>       Marque un flux comme valide
  stats                  Affiche les statistiques
  help                   Affiche cette aide

Exemples:
  node manage-rss-feeds.js list-invalid
  node manage-rss-feeds.js mark-valid "https://example.com/feed.xml"
  node manage-rss-feeds.js stats
`);
}

/**
 * Liste tous les flux
 */
async function listFeeds(validOnly = null) {
    try {
        const feeds = await rssRepository.getAllFeeds(false); // Récupérer tous

        let filteredFeeds = feeds;
        if (validOnly === true) {
            filteredFeeds = feeds.filter(feed => feed.valid);
            console.log(`\n✅ Flux RSS valides (${filteredFeeds.length}):`);
        } else if (validOnly === false) {
            filteredFeeds = feeds.filter(feed => !feed.valid);
            console.log(`\n❌ Flux RSS invalides (${filteredFeeds.length}):`);
        } else {
            console.log(`\n📋 Tous les flux RSS (${feeds.length}):`);
        }

        if (filteredFeeds.length === 0) {
            console.log('   Aucun flux trouvé');
            return;
        }

        filteredFeeds.forEach((feed, index) => {
            const status = feed.valid ? '✅' : '❌';
            const date = new Date(feed.created_at).toLocaleDateString();
            console.log(`   ${index + 1}. ${status} ${feed.url} (créé le ${date})`);
        });

    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
    }
}

/**
 * Affiche les statistiques
 */
async function showStats() {
    try {
        const feeds = await rssRepository.getAllFeeds(false);

        const validFeeds = feeds.filter(feed => feed.valid);
        const invalidFeeds = feeds.filter(feed => !feed.valid);

        const validPercentage = feeds.length > 0 ? Math.round((validFeeds.length / feeds.length) * 100) : 0;

        console.log(`\n📊 Statistiques des flux RSS:`);
        console.log(`   📋 Total: ${feeds.length} flux`);
        console.log(`   ✅ Valides: ${validFeeds.length} (${validPercentage}%)`);
        console.log(`   ❌ Invalides: ${invalidFeeds.length} (${100 - validPercentage}%)`);

        if (invalidFeeds.length > 0) {
            console.log(`\n🔍 Top 5 flux invalides récents:`);
            invalidFeeds
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5)
                .forEach((feed, index) => {
                    const date = new Date(feed.created_at).toLocaleDateString();
                    console.log(`   ${index + 1}. ${feed.url} (${date})`);
                });
        }

    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
    }
}

/**
 * Marque un flux comme invalide
 */
async function markInvalid(url) {
    if (!url) {
        console.error('❌ URL requise');
        return;
    }

    try {
        const success = await rssRepository.markAsInvalid(url, 'Marquage manuel');
        if (success) {
            console.log(`✅ Flux marqué comme invalide: ${url}`);
        } else {
            console.log(`⚠️ Flux non trouvé ou déjà invalide: ${url}`);
        }
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
    }
}

/**
 * Marque un flux comme valide
 */
async function markValid(url) {
    if (!url) {
        console.error('❌ URL requise');
        return;
    }

    try {
        const success = await rssRepository.markAsValid(url);
        if (success) {
            console.log(`✅ Flux marqué comme valide: ${url}`);
        } else {
            console.log(`⚠️ Flux non trouvé ou déjà valide: ${url}`);
        }
    } catch (error) {
        console.error(`❌ Erreur: ${error.message}`);
    }
}

// Exécution selon la commande
switch (command) {
    case 'list':
        await listFeeds();
        break;

    case 'list-valid':
        await listFeeds(true);
        break;

    case 'list-invalid':
        await listFeeds(false);
        break;

    case 'stats':
        await showStats();
        break;

    case 'mark-invalid':
        await markInvalid(args[1]);
        break;

    case 'mark-valid':
        await markValid(args[1]);
        break;

    case 'help':
    case '-h':
    case '--help':
        showHelp();
        break;

    default:
        if (!command) {
            console.log('❌ Aucune commande spécifiée');
        } else {
            console.log(`❌ Commande inconnue: ${command}`);
        }
        showHelp();
        process.exit(1);
}

process.exit(0);
