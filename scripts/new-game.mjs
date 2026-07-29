#!/usr/bin/env node
/**
 * new-game.mjs
 *
 * Genera un juego nuevo en games/<nombre> a partir de templates/phaser-starter,
 * sustituyendo placeholders de nombre/título/descripción.
 *
 * Uso:
 *   node scripts/new-game.mjs --name mi-juego --title "Mi Juego" \
 *       --description "Un puzzle rápido de 30 segundos" [--genre puzzle]
 *
 * Diseñado para ser invocado tanto por humanos como por agentes de IA
 * (Claude Code, Codex, OpenCode) siguiendo AGENTS.md.
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const GAMES_DIR = path.join(ROOT, 'games');

function parseArgs(argv) {
    const args = { genre: 'arcade' };
    for (let i = 0; i < argv.length; i += 2) {
        const key = argv[i]?.replace(/^--/, '');
        const value = argv[i + 1];
        if (key) args[key] = value;
    }
    return args;
}

function copyRecursive(src, dest) {
    const stat = fs.statSync(src);

    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
            copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

function replacePlaceholdersInFile(filePath, replacements) {
    const isTextFile = /\.(js|ts|json|html|css|md|mjs)$/.test(filePath);
    if (!isTextFile) return;

    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;

    for (const [placeholder, value] of Object.entries(replacements)) {
        if (content.includes(placeholder)) {
            content = content.split(placeholder).join(value);
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
    }
}

function walkAndReplace(dir, replacements) {
    for (const entry of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            walkAndReplace(fullPath, replacements);
        } else {
            replacePlaceholdersInFile(fullPath, replacements);
        }
    }
}

function main() {
    const args = parseArgs(process.argv.slice(2));

    if (!args.name) {
        console.error(
            'Falta --name. Uso: node scripts/new-game.mjs --name mi-juego ' +
            '[--title "Mi Juego"] [--description "..."] [--template phaser-starter|puzzle-starter|runner-starter|idle-starter]'
        );
        process.exit(1);
    }

    const gameName = args.name;
    const gameTitle = args.title || gameName;
    const gameDescription = args.description || `Playable: ${gameTitle}`;
    const templateName = args.template || 'phaser-starter';
    const templateDir = path.join(TEMPLATES_DIR, templateName);
    const destDir = path.join(GAMES_DIR, gameName);

    if (!fs.existsSync(templateDir)) {
        console.error(
            `No existe el template "${templateName}" en templates/. ` +
            `Disponibles: ${fs.readdirSync(TEMPLATES_DIR).join(', ')}`
        );
        process.exit(1);
    }

    if (fs.existsSync(destDir)) {
        console.error(`Ya existe games/${gameName}. Elige otro nombre o elimínalo primero.`);
        process.exit(1);
    }

    console.log(`Generando juego "${gameName}" desde el template "${templateName}"...`);
    copyRecursive(templateDir, destDir);

    walkAndReplace(destDir, {
        __GAME_NAME__: gameName,
        __GAME_TITLE__: gameTitle,
        __GAME_DESCRIPTION__: gameDescription
    });

    console.log(`Listo. Juego creado en games/${gameName} (template: ${templateName})`);
    console.log('');
    console.log('Próximos pasos:');
    console.log(`  cd games/${gameName}`);
    console.log('  npm install');
    console.log('  npm run dev            # http://localhost:8080');
    console.log('  npm run agent-check    # typecheck + lint + validate + build, todo en uno');
    console.log('');
    console.log(
        'Recuerda: antes de tocar la integración del SDK o el diseño ' +
        'responsive, lee las skills correspondientes en SKILLS/ (ver AGENTS.md).'
    );
}

main();
