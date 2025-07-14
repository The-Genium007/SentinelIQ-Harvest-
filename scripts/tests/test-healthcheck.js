#!/usr/bin/env node

/**
 * Script de test pour le serveur healthcheck
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const HEALTH_PORT = 3001;

async function testHealthServer() {
    console.log('🚀 Test du serveur healthcheck...');

    // Démarrer le serveur
    const server = spawn('node', ['index.js'], {
        env: { ...process.env, HEALTH_PORT },
        stdio: 'pipe'
    });

    let serverStarted = false;

    // Écouter les logs du serveur
    server.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Serveur healthcheck démarré')) {
            serverStarted = true;
        }
        console.log(`[SERVER] ${output.trim()}`);
    });

    server.stderr.on('data', (data) => {
        console.error(`[SERVER ERROR] ${data.toString().trim()}`);
    });

    // Attendre que le serveur démarre
    let attempts = 0;
    while (!serverStarted && attempts < 10) {
        await setTimeout(500);
        attempts++;
    }

    if (!serverStarted) {
        console.error('❌ Le serveur n\'a pas démarré à temps');
        server.kill();
        return;
    }

    console.log('✅ Serveur démarré, test des endpoints...\n');

    // Tester les endpoints
    const endpoints = [
        { path: '/health', description: 'État général du système' },
        { path: '/ready', description: 'Vérification de disponibilité' },
        { path: '/metrics', description: 'Métriques système' },
        { path: '/invalid', description: 'Endpoint inexistant (404)' }
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`🔍 Test ${endpoint.path} - ${endpoint.description}`);

            const response = await fetch(`http://localhost:${HEALTH_PORT}${endpoint.path}`);
            const data = await response.text();

            console.log(`   Status: ${response.status}`);
            console.log(`   Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}\n`);

        } catch (error) {
            console.error(`   ❌ Erreur: ${error.message}\n`);
        }
    }

    // Arrêter le serveur
    console.log('🛑 Arrêt du serveur de test...');
    server.kill();

    await setTimeout(1000);
    console.log('✅ Test terminé');
}

// Fonction fetch pour Node.js < 18
if (!globalThis.fetch) {
    globalThis.fetch = async (url) => {
        const { default: fetch } = await import('node-fetch');
        return fetch(url);
    };
}

testHealthServer().catch(console.error);
