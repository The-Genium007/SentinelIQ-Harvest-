// Import des fonctions utilitaires depuis la nouvelle couche database et de la bibliothèque puppeteer
import { articleUrlRepository, articleRepository, testSupabaseConnection } from '../database/index.js';
import puppeteer from 'puppeteer';
import pLimit from 'p-limit'; // Ajout de p-limit
import fs from 'fs'; // Ajout de fs pour le logging

// Création d'un flux d'écriture pour le fichier de log
const logStream = fs.createWriteStream('scrap.log', { flags: 'a' });

// Redéfinition de console.log et console.error pour écrire aussi dans le fichier
const origLog = console.log;
const origErr = console.error;
console.log = (...args) => {
    origLog(...args);
    logStream.write(`[LOG ${new Date().toISOString()}] ` + args.map(String).join(' ') + '\n');
};
console.error = (...args) => {
    origErr(...args);
    logStream.write(`[ERR ${new Date().toISOString()}] ` + args.map(String).join(' ') + '\n');
};

// Fonction principale auto-exécutée (IIFE) asynchrone
export async function launch(playload) {
    console.log('⏳ Démarrage du script de scraping...', playload);
    // Test de la connexion à Supabase
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
        console.log('❌ Connexion Supabase échouée.');
        return;
    }
    console.log('🔗 Connexion Supabase OK.');

    // URLs de test pour le développement
    // Récupération des URLs depuis Supabase
    const urlsData = await articleUrlRepository.findAll(); // [{ url: "https://..." }, ...]
    const urls = urlsData.map(item => ({ url: item.url })); // Conversion au format attendu
    console.log(`🔎 ${urls.length} URL(s) à traiter.`);

    // Limite à 3 requêtes simultanées (modifiable)
    const limit = pLimit(3);

    // Scraping parallèle limité
    const articles = await Promise.all(
        urls.map(e => limit(async () => {
            console.log(`➡️  Vérification de l'article : ${e.url}`);
            try {
                // Vérifie si l'article existe déjà dans la base
                const existe = await articleRepository.existsByUrl(e.url);
                if (existe) {
                    console.log(`⏭️ Article déjà présent : ${e.url}`);
                    return null;
                }
                // Si non existant, on scrape
                console.log(`🕷️  Scraping de l'article : ${e.url}`);
                const article = await scrapeArticle(e.url);
                if (article) {
                    console.log(`✅ Article récupéré :`, article);
                    return { ...article, url: e.url };
                } else {
                    console.log(`❌ Impossible de récupérer l'article : ${e.url}`);
                    return null;
                }
            } catch (err) {
                console.error(`❌ Erreur lors du traitement de l'URL ${e.url} :`, err.message);
                return null;
            }
        }))
    );

    // Filtrage des articles valides (suppression des échecs de scraping ou déjà présents)
    const articlesValides = articles.filter(a => a !== null);
    console.log(`📦 ${articlesValides.length} article(s) à insérer dans la base.`);

    // Insertion des articles valides dans la base Supabase
    for (const article of articlesValides) {
        console.log(`💾 Insertion de l'article : ${article.url}`);
        await articleRepository.saveProcessedArticle(article);
    }
    console.log('✅ Script terminé.');

};

/**
 * Fonction pour extraire le contenu d'un article web
 * @param {string} url - URL de l'article à scraper
 * @returns {Promise<Object|null>} Données de l'article ou null en cas d'échec
 */
async function scrapeArticle(url) {
    // Initialisation du navigateur headless avec Chrome
    // Ancienne version (commentée)
    // const browser = await puppeteer.launch({
    //     headless: true,
    //     executablePath: '/Users/lucasgiza/.cache/puppeteer/chrome/mac-137.0.7151.70/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
    // });

    // Nouvelle version compatible Docker/Alpine
    const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    });
    const page = await browser.newPage();

    try {
        // Navigation vers l'URL avec un timeout de 30 secondes
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        // Attente que le contenu soit chargé
        await page.waitForSelector('body');

        // Extraction des données dans le contexte de la page
        const data = await page.evaluate(() => {
            // Fonction utilitaire pour extraire le texte principal
            function getMainText() {
                // Essaie d'abord de trouver une balise <article>
                const article = document.querySelector('article');
                if (article) return article.innerText;

                // Sinon, cherche dans <main> ou <body>
                const possible = document.querySelector('main') || document.querySelector('body');
                return possible ? possible.innerText : '';
            }

            // Retourne un objet avec les données extraites
            return {
                title: document.title || document.querySelector('h1')?.innerText || '',
                url: window.location.href,
                content: getMainText(),
                publishDate: document.querySelector('time')?.getAttribute('datetime') || ''
            };
        });

        // Nettoyage : suppression des retours à la ligne du contenu
        data.content = data.content.replace(/\n/g, ' ');
        // Ajoute la date du jour si absente, au format YYYY-MM-DD
        if (!data.publishDate) {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            data.publishDate = `${yyyy}-${mm}-${dd}`;
        }
        return data;

    } catch (err) {
        // Gestion des erreurs de scraping
        console.error(`Erreur pendant le scraping de ${url}`, err);
        return null;
    } finally {
        // Fermeture propre du navigateur dans tous les cas
        await browser.close();
    }
}