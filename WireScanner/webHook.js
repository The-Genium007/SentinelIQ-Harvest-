// Utilitaire pour envoyer un webhook HTTP POST
import fetch from 'node-fetch';

/**
 * Envoie un webhook POST à l'URL spécifiée avec un payload JSON.
 * @param {string} url - L'URL du webhook
 * @param {object} payload - Les données à envoyer
 * @returns {Promise<Response>} La réponse du serveur
 */
export async function sendWebhook(url, payload) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
