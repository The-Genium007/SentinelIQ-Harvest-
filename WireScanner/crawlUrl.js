import { getRssFeeds, testSupabaseConnection, articleExists, insertArticle } from './supabaseUtils.js';
import { parseFeed, isValidUrl } from './rssUtils.js';

/**
 * Fonction principale pour crawler les flux RSS et insérer les nouveaux articles dans la base Supabase.
 * - Récupère la liste des flux RSS depuis Supabase
 * - Pour chaque flux, parse les articles
 * - Insère les nouveaux articles non présents dans la base
 */
export async function crawlUrl() {
    // Récupération des URLs de flux RSS depuis la table ListUrlRss de Supabase
    const sources = await getRssFeeds();
    // Vérification de la connexion à Supabase
    await testSupabaseConnection();

    let totalArticlesInserted = 0; // Compteur pour les articles insérés

    // Parcours de chaque source RSS récupérée depuis la base
    for (const source of sources) {
        // Vérification de la validité de l'URL
        if (!isValidUrl(source.url)) {
            console.warn(`⚠️ URL invalide ignorée : ${source.url}`);
            continue;
        }

        console.log(`📥 Lecture de ${source.url}`);
        try {
            // Parsing du flux RSS
            const feed = await parseFeed(source.url);
            // Parcours de chaque article du flux
            for (const item of feed.items) {
                const articleUrl = item.link;
                // Vérifie que l'URL de l'article est valide
                if (articleUrl && isValidUrl(articleUrl)) {
                    try {
                        // Vérifie si l'article existe déjà dans la base
                        if (!(await articleExists(articleUrl))) {
                            // Insertion de l'article s'il n'existe pas
                            await insertArticle(articleUrl);
                            totalArticlesInserted++; // Incrémente le compteur
                            console.log(`✅ Article inséré : ${articleUrl}`);
                        } else {
                            // L'article existe déjà
                            console.log(`🔁 Article déjà présent : ${articleUrl}`);
                        }
                    } catch (err) {
                        // Affiche une erreur si la vérification ou l'insertion échoue
                        console.error(err.message);
                    }
                }
            }
        } catch (err) {
            // Affiche un avertissement si le parsing du flux échoue
            console.warn(`❌ Erreur lors du traitement du flux : ${source.url}`, err.message);
        }
    }

    // Log de fin de scrapping
    logScrapingCompletion(sources.length, totalArticlesInserted);
}

/**
 * Détecte la fin du scrapping et log un message de confirmation.
 * @param {number} totalSources - Nombre total de sources traitées
 * @param {number} totalArticles - Nombre total d'articles insérés
 */
function logScrapingCompletion(totalSources, totalArticles) {
    console.log(`✅ Scrapping terminé : ${totalSources} sources traitées, ${totalArticles} articles insérés.`);
}