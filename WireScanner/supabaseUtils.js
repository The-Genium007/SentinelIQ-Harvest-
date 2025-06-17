// Fonctions utilitaires pour la gestion de Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// Chargement des variables d'environnement depuis le fichier key.env
dotenv.config({ path: '../key.env' });

// Initialisation du client Supabase avec les clés d'environnement
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * Récupère la liste des flux RSS depuis la table ListUrlRss de Supabase.
 * @returns {Promise<Array<{url: string}>>} Liste des objets contenant les URLs de flux RSS
 */
export async function getRssFeeds() {
    const { data: feeds, error } = await supabase.from('ListUrlRss').select('url');
    if (error) {
        throw new Error(`Erreur lors de la récupération des flux depuis Supabase : ${error.message}`);
    }
    return feeds.map(f => ({ url: f.url }));
}

/**
 * Teste la connexion à Supabase en effectuant une requête simple.
 * @throws {Error} Si la connexion échoue
 */
export async function testSupabaseConnection() {
    const { error } = await supabase.from('ListUrlRss').select('id').limit(1);
    if (error) {
        throw new Error(`Test de connexion Supabase échoué : ${error.message}`);
    }
}

/**
 * Vérifie si un article existe déjà dans la table articlesUrl.
 * @param {string} articleUrl - L'URL de l'article à vérifier
 * @returns {Promise<boolean>} true si l'article existe, false sinon
 * @throws {Error} Si la requête échoue
 */
export async function articleExists(articleUrl) {
    const { data: existing, error } = await supabase
        .from('articlesUrl')
        .select('url')
        .eq('url', articleUrl)
        .maybeSingle();
    if (error) {
        throw new Error(`Erreur lors de la vérification de l'URL : ${articleUrl} - ${error.message}`);
    }
    return !!existing;
}

/**
 * Insère un nouvel article dans la table articlesUrl.
 * @param {string} articleUrl - L'URL de l'article à insérer
 * @throws {Error} Si l'insertion échoue
 */
export async function insertArticle(articleUrl) {
    const { error } = await supabase
        .from('articlesUrl')
        .insert({ url: articleUrl });
    if (error) {
        throw new Error(`Erreur lors de l’insertion de l’article : ${articleUrl} - ${error.message}`);
    }
}
