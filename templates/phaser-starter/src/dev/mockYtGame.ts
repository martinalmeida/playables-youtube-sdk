/**
 * mockYtGame.ts — instala un `window.ytgame` de mentira, SOLO en modo
 * desarrollo, si el real no está presente. Sirve para:
 *   - Probar el flujo completo (firstFrameReady, gameReady, onPause/onResume,
 *     save/load, sendScore) sin depender siempre del Test Suite real de
 *     Google.
 *   - Automatizar tests con Playwright/Puppeteer sin un entorno de YouTube.
 *
 * IMPORTANTE: esto se importa condicionalmente (`import.meta.env.DEV`) y
 * jamás debe terminar en el bundle de producción. Vite elimina el import
 * completo vía tree-shaking cuando la condición es falsa en build.
 *
 * No sustituye al Test Suite oficial para la validación final antes de
 * enviar el juego — solo acelera la iteración local.
 */
import type { YTGameSDK } from '../lib/YouTubePlayables';

const STORAGE_KEY = '__mock_ytgame_save__';

export function installMockSdk(): void {
    if (typeof window === 'undefined' || window.ytgame) return;

    let audioEnabled = true;
    const audioListeners: Array<(enabled: boolean) => void> = [];
    let pauseCb: (() => void) | null = null;
    let resumeCb: (() => void) | null = null;

    const mock: YTGameSDK = {
        game: {
            firstFrameReady: () => console.log('[mockYtGame] firstFrameReady()'),
            gameReady: () => console.log('[mockYtGame] gameReady()'),
            saveData: (data: string) => {
                console.log('[mockYtGame] saveData()', data);
                window.localStorage.setItem(STORAGE_KEY, data);
            },
            loadData: async () => {
                const raw = window.localStorage.getItem(STORAGE_KEY);
                console.log('[mockYtGame] loadData()', raw);
                return raw;
            }
        },
        system: {
            onPause: (cb) => {
                pauseCb = cb;
            },
            onResume: (cb) => {
                resumeCb = cb;
            },
            isAudioEnabled: () => audioEnabled,
            onAudioEnabledChange: (cb) => {
                audioListeners.push(cb);
            },
            getLanguage: async () => navigator.language || 'en'
        },
        engagement: {
            sendScore: ({ value }) => console.log('[mockYtGame] sendScore()', value)
        }
    };

    window.ytgame = mock;

    // Atajos de teclado solo-dev para simular eventos del SDK manualmente:
    // P = pausar/reanudar, M = alternar audio.
    window.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') {
            console.log('[mockYtGame] simulando onPause()');
            pauseCb?.();
            setTimeout(() => {
                console.log('[mockYtGame] simulando onResume()');
                resumeCb?.();
            }, 1000);
        }
        if (e.key === 'm' || e.key === 'M') {
            audioEnabled = !audioEnabled;
            console.log('[mockYtGame] simulando cambio de audio:', audioEnabled);
            audioListeners.forEach((cb) => cb(audioEnabled));
        }
    });

    console.info(
        '[mockYtGame] SDK simulado instalado (solo dev). Atajos: P = pausar/reanudar, M = alternar audio.'
    );
}
