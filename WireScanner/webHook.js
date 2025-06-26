// Utilitaire pour envoyer un webhook HTTP POST
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Charge le fichier .env situé dans le dossier parent
dotenv.config({ path: './key.env' });

/**
 * Envoie un webhook POST à l'URL spécifiée avec un payload JSON et un token d'authentification si présent.
 * @param {string} url - L'URL du webhook
 * @param {object} payload - Les données à envoyer
 * @returns {Promise<Response>} La réponse du serveur
 */
export async function sendWebhook(url, payload) {
    const token = process.env.WEBHOOK_TOKEN;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
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
