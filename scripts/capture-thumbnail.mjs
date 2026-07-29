#!/usr/bin/env node
/**
 * capture-thumbnail.mjs
 *
 * Levanta el servidor de dev de un juego, espera a que MainMenu esté visible,
 * y captura un screenshot cuadrado (1:1, ≥512x512) a store-assets/thumbnail.png
 * — cumpliendo el requisito de tamaño de SKILLS/asset-pipeline/SKILL.md.
 *
 * Esto genera una miniatura BASE (el fondo/título tal cual se ve en el
 * juego). No sustituye una miniatura diseñada a propósito, pero le da al
 * agente un punto de partida automático en vez de un placeholder en blanco,
 * y garantiza que al menos las dimensiones y el formato sean correctos.
 *
 * Uso:
 *   node scripts/capture-thumbnail.mjs games/mi-juego
 *
 * Requiere que el juego ya tenga `node_modules` instalado y Playwright
 * disponible (devDependency del template).
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const SIZE = 512;
const PORT = 8082;

function waitForServer(url, timeoutMs = 20000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const tryFetch = async () => {
            try {
                const res = await fetch(url);
                if (res.ok) return resolve();
            } catch {
                // servidor aún no responde
            }
            if (Date.now() - start > timeoutMs) {
                reject(new Error(`Timeout esperando ${url}`));
                return;
            }
            setTimeout(tryFetch, 300);
        };
        tryFetch();
    });
}

async function main() {
    const gameDir = process.argv[2];

    if (!gameDir || !fs.existsSync(gameDir)) {
        console.error('Uso: node scripts/capture-thumbnail.mjs <ruta-al-juego>');
        process.exit(1);
    }

    const storeAssetsDir = path.join(gameDir, 'store-assets');
    fs.mkdirSync(storeAssetsDir, { recursive: true });

    console.log('Levantando servidor de dev...');
    const server = spawn('npm', ['run', 'dev', '--', '--port', String(PORT)], {
        cwd: gameDir,
        stdio: 'ignore'
    });

    try {
        await waitForServer(`http://localhost:${PORT}`);

        const browser = await chromium.launch();
        const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });

        await page.goto(`http://localhost:${PORT}`);
        await page.locator('#game-container canvas').waitFor({ state: 'visible', timeout: 15000 });
        await page.waitForTimeout(1200); // dejar que MainMenu termine su fade-in

        const outputPath = path.join(storeAssetsDir, 'thumbnail.png');
        await page.screenshot({ path: outputPath });
        await browser.close();

        console.log(`Miniatura base guardada en ${outputPath} (${SIZE}x${SIZE}px).`);
        console.log(
            'Recuerda: sigue siendo una captura automática del MainMenu, no un diseño ' +
            'a propósito. Revisa que cumpla la zona segura del 12% superior/inferior ' +
            '(ver SKILLS/asset-pipeline/SKILL.md) antes de usarla para certificación.'
        );
    } finally {
        server.kill();
    }
}

main().catch((err) => {
    console.error('Error capturando la miniatura:', err);
    process.exit(1);
});
