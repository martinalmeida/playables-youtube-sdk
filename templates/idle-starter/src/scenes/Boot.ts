import Phaser from 'phaser';
import { YouTubePlayables } from '../lib/YouTubePlayables';
import { createSaveManager } from '../core/SaveManager';
import { AudioManager } from '../core/AudioManager';
import { Localization } from '../core/Localization';
import { attachDebugOverlay } from '../core/DebugOverlay';

/**
 * Boot (idle): además de lo estándar, el esquema de guardado incluye
 * `lastSavedAt` (timestamp) para poder calcular progreso offline al volver
 * a abrir el juego — el patrón central de cualquier idle/clicker.
 */
export interface SaveData {
    currency: number;
    perSecond: number;
    lastSavedAt: number;
}

export const saveManager = createSaveManager<SaveData>({
    version: 1,
    defaults: { currency: 0, perSecond: 1, lastSavedAt: Date.now() }
});

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    async create(): Promise<void> {
        await saveManager.load();

        AudioManager.init(this);

        Localization.registerDictionary('en', { play: 'PLAY', retry: 'RETRY' });
        Localization.registerDictionary('es', { play: 'JUGAR', retry: 'REINTENTAR' });
        await Localization.autoDetect();

        YouTubePlayables.setOnPause(() => {
            saveManager.set('lastSavedAt', Date.now());
            saveManager.saveImmediate();
            this.game.pause();
        });

        YouTubePlayables.setOnResume(() => {
            this.game.resume();
        });

        if (import.meta.env.DEV) {
            attachDebugOverlay(this);
        }

        this.scene.start('Preloader');
    }
}
