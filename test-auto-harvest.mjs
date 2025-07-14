#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

const startTime = Date.now();

console.log('🧪 Test auto-harvest simple...');

const child = spawn('npm', ['run', 'wire-scanner:direct'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
});

child.on('exit', (code, signal) => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.log(`\n🏁 Processus terminé après ${duration}s`);
    console.log(`📊 Code de sortie: ${code}`);
    console.log(`🔥 Signal: ${signal}`);

    if (code === 0) {
        console.log('✅ Succès !');
    } else {
        console.log('❌ Échec');
    }

    process.exit(code);
});

child.on('error', (error) => {
    console.error('❌ Erreur:', error);
    process.exit(1);
});

// Timeout de 10 minutes
setTimeout(() => {
    console.log('\n⏰ Timeout de 10 minutes atteint, arrêt du processus...');
    child.kill('SIGTERM');
    setTimeout(() => {
        child.kill('SIGKILL');
    }, 5000);
}, 600000);

console.log('⏳ Démarrage du crawling...');
