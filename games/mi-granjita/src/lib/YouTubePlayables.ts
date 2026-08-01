/**
 * YouTubePlayables.ts
 *
 * Wrapper tipado sobre el objeto global `ytgame` que YouTube inyecta cuando
 * un Playable corre embebido. Referencia oficial:
 * https://developers.google.com/youtube/gaming/playables/reference/sdk
 *
 * Agnóstico de motor: JS/TS plano, importable desde cualquier framework.
 */

export interface YTGameSDK {
    game: {
        firstFrameReady(): void;
        gameReady(): void;
        saveData(data: string): void;
        loadData(): Promise<string | null>;
    };
    system: {
        onPause(callback: () => void): void;
        onResume(callback: () => void): void;
        isAudioEnabled(): boolean;
        onAudioEnabledChange(callback: (enabled: boolean) => void): void;
        getLanguage(): Promise<string> | string;
    };
    engagement: {
        sendScore(payload: { value: number }): void;
    };
}

declare global {
    interface Window {
        ytgame?: YTGameSDK;
    }
}

function sdkAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.ytgame !== 'undefined';
}

function boot(callback: () => void, { sdkTimeoutMs = 3000 }: { sdkTimeoutMs?: number } = {}): void {
    const start = () => {
        if (sdkAvailable()) {
            callback();
            return;
        }

        const beganAt = Date.now();
        const poll = setInterval(() => {
            if (sdkAvailable()) {
                clearInterval(poll);
                callback();
            } else if (Date.now() - beganAt > sdkTimeoutMs) {
                clearInterval(poll);
                console.warn(
                    '[YouTubePlayables] SDK no detectado tras el timeout. ' +
                        'Continuando en modo standalone (fuera del Test Suite / YouTube).'
                );
                callback();
            }
        }, 50);
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }
}

function firstFrameReady(): void {
    if (sdkAvailable()) window.ytgame!.game.firstFrameReady();
}

function gameReady(): void {
    if (sdkAvailable()) window.ytgame!.game.gameReady();
}

function setOnPause(callback: () => void): void {
    if (sdkAvailable()) window.ytgame!.system.onPause(callback);
}

function setOnResume(callback: () => void): void {
    if (sdkAvailable()) window.ytgame!.system.onResume(callback);
}

function isAudioEnabled(): boolean {
    return sdkAvailable() ? window.ytgame!.system.isAudioEnabled() : true;
}

function setAudioChangeCallback(callback: (enabled: boolean) => void): void {
    if (sdkAvailable()) window.ytgame!.system.onAudioEnabledChange(callback);
}

async function loadLanguage(): Promise<string> {
    if (sdkAvailable()) return window.ytgame!.system.getLanguage();
    return 'en';
}

function sendScore(value: number): void {
    if (sdkAvailable()) {
        window.ytgame!.engagement.sendScore({ value });
    } else {
        console.log('[YouTubePlayables] sendScore (modo standalone):', value);
    }
}

function saveData<T>(data: T): void {
    const asString = JSON.stringify(data);
    if (sdkAvailable()) {
        window.ytgame!.game.saveData(asString);
    } else {
        localStorageFallbackSave(asString);
    }
}

async function loadData<T>(): Promise<T | null> {
    if (sdkAvailable()) {
        const raw = await window.ytgame!.game.loadData();
        return raw ? (JSON.parse(raw) as T) : null;
    }
    return localStorageFallbackLoad<T>();
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout tras ${ms}ms`)), ms))
    ]);
}

const STANDALONE_KEY = '__playables_standalone_save__';

function localStorageFallbackSave(jsonString: string): void {
    try {
        window.localStorage.setItem(STANDALONE_KEY, jsonString);
    } catch (err) {
        console.warn('[YouTubePlayables] No se pudo guardar en modo standalone:', err);
    }
}

function localStorageFallbackLoad<T>(): T | null {
    try {
        const raw = window.localStorage.getItem(STANDALONE_KEY);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
        console.warn('[YouTubePlayables] No se pudo cargar en modo standalone:', err);
        return null;
    }
}

export const YouTubePlayables = {
    sdkAvailable,
    boot,
    firstFrameReady,
    gameReady,
    setOnPause,
    setOnResume,
    isAudioEnabled,
    setAudioChangeCallback,
    loadLanguage,
    sendScore,
    saveData,
    loadData,
    withTimeout
};

export default YouTubePlayables;
