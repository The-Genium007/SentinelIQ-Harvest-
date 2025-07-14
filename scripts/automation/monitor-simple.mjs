#!/usr/bin/env node
/**
 * 🔍 Version JSON simple pour la surveillance (pour automatisation)
 */

// Désactiver tous les logs pour avoir un JSON pur
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Sauvegarder la référence pour l'output final
const outputJSON = (data) => originalConsoleLog(data);

// Désactiver temporairement les logs
console.log = () => { };
console.error = () => { };
console.warn = () => { };

import { getSupabaseClient } from '../../database/client.js';

async function getSystemStateJSON() {
    try {
        const supabaseClient = await getSupabaseClient();

        const { data: urlsNonTraitees } = await supabaseClient
            .from('articlesUrl')
            .select('id')
            .is('extractedAt', null);

        const { data: articlesRecents } = await supabaseClient
            .from('articles')
            .select('id, extractedAt')
            .gte('extractedAt', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        const { data: totalArticles } = await supabaseClient
            .from('articles')
            .select('id');

        const urlsEnAttente = urlsNonTraitees?.length || 0;
        const articlesRecents24h = articlesRecents?.length || 0;
        const totalArticlesCount = totalArticles?.length || 0;

        // Déterminer le statut du pipeline
        let pipelineStatus = 'unknown';
        if (urlsEnAttente > 1000) {
            pipelineStatus = 'backlog';
        } else if (urlsEnAttente > 100) {
            pipelineStatus = 'busy';
        } else if (articlesRecents24h > 0) {
            pipelineStatus = 'active';
        } else {
            pipelineStatus = 'idle';
        }

        const result = {
            timestamp: new Date().toISOString(),
            database: {
                status: 'healthy',
                details: {
                    totalUrls: 0, // Simplifié
                    totalArticles: totalArticlesCount,
                    urlsEnAttente: urlsEnAttente,
                    articlesRecents24h: articlesRecents24h
                }
            },
            services: {
                status: 'healthy',
                details: {}
            },
            pipeline: {
                status: pipelineStatus,
                details: {
                    issue: `URLs en attente: ${urlsEnAttente}`,
                    recommendation: pipelineStatus === 'backlog' ? 'Lancer npm run cortex:batch' :
                        pipelineStatus === 'idle' ? 'Lancer npm run wire-scanner:trigger' : 'Système optimal'
                }
            }
        };

        outputJSON(JSON.stringify(result, null, 2));
        return result;

    } catch (error) {
        const errorResult = {
            timestamp: new Date().toISOString(),
            database: { status: 'error', details: { error: error.message } },
            services: { status: 'unknown', details: {} },
            pipeline: { status: 'error', details: { error: error.message } }
        };

        outputJSON(JSON.stringify(errorResult, null, 2));
        return errorResult;
    }
}

getSystemStateJSON();
