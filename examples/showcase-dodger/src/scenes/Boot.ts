import Phaser from 'phaser';
import { YouTubePlayables } from '../lib/YouTubePlayables';
import { createSaveManager } from '../core/SaveManager';
import { AudioManager } from '../core/AudioManager';
import { Localization } from '../core/Localization';
import { attachDebugOverlay } from '../core/DebugOverlay';

/**
 * Boot: primera escena. Inicializa todos los sistemas core compartidos:
 * SaveManager, AudioManager, Localization, handlers globales de
 * pause/resume, y el DebugOverlay (solo en dev).
 *
 * Ver SKILLS/playables-sdk-integration/SKILL.md y
 * SKILLS/core-libraries/SKILL.md antes de modificar esta escena.
 */

// TODO(agente): ajustar el esquema de guardado real del juego.
export interface SaveData {
    bestScore: number;
}

export const saveManager = createSaveManager<SaveData>({
    version: 1,
    defaults: { bestScore: 0 }
});

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    async create(): Promise<void> {
        await saveManager.load();

        AudioManager.init(this);

        // TODO(agente): registrar los diccionarios reales del juego.
        Localization.registerDictionary('en', { play: 'PLAY', retry: 'RETRY' });
        Localization.registerDictionary('es', { play: 'JUGAR', retry: 'REINTENTAR' });
        await Localization.autoDetect();

        YouTubePlayables.setOnPause(() => {
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
