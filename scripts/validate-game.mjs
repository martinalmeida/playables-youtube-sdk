#!/usr/bin/env node
/**
 * validate-game.mjs
 *
 * Convierte el checklist de SKILLS/certification-checklist/SKILL.md en
 * verificaciones automáticas. Es análisis estático por patrones de texto,
 * no un análisis semántico completo — atrapa los errores más comunes y
 * documentados, pero no reemplaza al Test Suite oficial de Google ni al
 * juicio del agente/desarrollador.
 *
 * Uso:
 *   node scripts/validate-game.mjs games/mi-juego
 *
 * Exit code 0 = todo OK. Exit code 1 = hay al menos un error.
 */
import fs from 'node:fs';
import path from 'node:path';

const CHECKS = [
    {
        name: 'No usa Page Visibility API',
        severity: 'error',
        test: (files) => {
            const offenders = files.filter((f) => /visibilitychange|document\.visibilityState/.test(f.content));
            return {
                pass: offenders.length === 0,
                detail: offenders.map((f) => f.relPath).join(', ')
            };
        }
    },
    {
        name: 'firstFrameReady() está presente',
        severity: 'error',
        test: (files) => {
            const found = files.some((f) => f.content.includes('firstFrameReady()'));
            return { pass: found, detail: found ? '' : 'No se encontró ninguna llamada a firstFrameReady()' };
        }
    },
    {
        name: 'gameReady() está presente',
        severity: 'error',
        test: (files) => {
            const found = files.some((f) => f.content.includes('gameReady()'));
            return { pass: found, detail: found ? '' : 'No se encontró ninguna llamada a gameReady()' };
        }
    },
    {
        name: 'onPause guarda progreso (llama a save)',
        severity: 'warning',
        test: (files) => {
            const bootFile = files.find((f) => /Boot\.(js|ts)$/.test(f.relPath));
            if (!bootFile) return { pass: false, detail: 'No se encontró Boot.js/Boot.ts' };
            const hasOnPause = bootFile.content.includes('setOnPause');
            const savesInsidePause =
                /setOnPause\s*\(\s*\(\)\s*=>\s*\{[^}]*save/i.test(bootFile.content.replace(/\n/g, ' '));
            return {
                pass: hasOnPause && savesInsidePause,
                detail: hasOnPause ? 'setOnPause existe pero no parece llamar a save/saveImmediate dentro' : 'No se registró setOnPause en Boot'
            };
        }
    },
    {
        name: 'No hay dimensiones de canvas fijas en la config de Phaser.Game',
        severity: 'warning',
        test: (files) => {
            const mainFile = files.find((f) => /main\.(js|ts)$/.test(f.relPath));
            if (!mainFile) return { pass: false, detail: 'No se encontró main.js/main.ts' };
            const usesResizeOrFit = /Scale\.(RESIZE|FIT|ENVELOP)/.test(mainFile.content);
            const hasFixedDims = /width:\s*\d+/.test(mainFile.content) && /height:\s*\d+/.test(mainFile.content);
            return {
                pass: usesResizeOrFit && !hasFixedDims,
                detail: !usesResizeOrFit
                    ? 'No se detectó Scale.RESIZE/FIT/ENVELOP'
                    : 'Se detectaron dimensiones numéricas fijas junto al modo de escalado'
            };
        }
    },
    {
        name: 'loadData() tiene manejo de timeout/errores',
        severity: 'warning',
        test: (files) => {
            const usesLoadData = files.some((f) => f.content.includes('loadData('));
            if (!usesLoadData) return { pass: true, detail: 'No se usa loadData() directamente en este juego' };
            const usesTimeoutOrCatch = files.some(
                (f) => f.content.includes('withTimeout') || /try\s*\{[\s\S]*loadData/.test(f.content)
            );
            return {
                pass: usesTimeoutOrCatch,
                detail: usesTimeoutOrCatch ? '' : 'loadData() se usa sin withTimeout ni try/catch visible'
            };
        }
    },
    {
        name: 'store-assets/ existe con material de publicación',
        severity: 'warning',
        test: (_files, gameDir) => {
            const storeAssetsDir = path.join(gameDir, 'store-assets');
            const exists = fs.existsSync(storeAssetsDir);
            return {
                pass: exists,
                detail: exists ? '' : 'No existe store-assets/ (miniatura, video preview, descripción, título)'
            };
        }
    }
];

function walkSourceFiles(dir) {
    const results = [];
    const stack = [dir];

    while (stack.length) {
        const current = stack.pop();
        for (const entry of fs.readdirSync(current)) {
            if (entry === 'node_modules' || entry === 'dist') continue;
            const fullPath = path.join(current, entry);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                stack.push(fullPath);
            } else if (/\.(js|ts|html)$/.test(entry)) {
                results.push({
                    relPath: path.relative(dir, fullPath),
                    content: fs.readFileSync(fullPath, 'utf-8')
                });
            }
        }
    }

    return results;
}

function main() {
    const gameDir = process.argv[2];

    if (!gameDir || !fs.existsSync(gameDir)) {
        console.error('Uso: node scripts/validate-game.mjs <ruta-al-juego>');
        console.error('Ejemplo: node scripts/validate-game.mjs games/mi-juego');
        process.exit(1);
    }

    const srcDir = path.join(gameDir, 'src');
    if (!fs.existsSync(srcDir)) {
        console.error(`No se encontró ${srcDir}. ¿Es una ruta de juego válida?`);
        process.exit(1);
    }

    const files = walkSourceFiles(srcDir);
    let hasErrors = false;

    console.log(`\nValidando ${gameDir}...\n`);

    for (const check of CHECKS) {
        const result = check.test(files, gameDir);
        const icon = result.pass ? '✅' : check.severity === 'error' ? '❌' : '⚠️';
        console.log(`${icon}  ${check.name}${result.pass ? '' : ` — ${result.detail}`}`);

        if (!result.pass && check.severity === 'error') hasErrors = true;
    }

    console.log('');

    if (hasErrors) {
        console.error('Validación fallida: hay errores que bloquean la certificación.');
        process.exit(1);
    }

    console.log('Validación completada. Revisa las advertencias (⚠️) manualmente si las hay.');
    console.log('Recuerda: esto NO reemplaza al Test Suite oficial de YouTube Playables.');
}

main();
