// Utilitaire pour envoyer un webhook HTTP POST
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Charge le fichier .env situé dans le dossier parent
dotenv.config({ path: './key.env' });
const url = process.env.SCRAPING_WEBHOOK_URL;

/**
 * Envoie un webhook POST à l'URL spécifiée avec un payload JSON et un token d'authentification si présent.
 * @param {string} url - L'URL du webhook
 * @returns {Promise<Response>} La réponse du serveur
 */
export async function sendWebhook(url) {
    const token = process.env.WEBHOOK_TOKEN;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const payload = { message: 'SentinelIQ Harvester ending !' };
    console.log('Payload envoyé :', JSON.stringify(payload, null, 2));
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`Erreur webhook: ${response.status} ${response.statusText}`);
        }
        return response;
    } catch (err) {
        console.error('Erreur lors de l’envoi du webhook:', err.message);
        throw err;
    }
}