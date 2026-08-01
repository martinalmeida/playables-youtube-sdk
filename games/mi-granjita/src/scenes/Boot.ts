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

// Esquema de guardado de "Mi Granjita":
//   totalStars        — estrellas acumuladas entre todas las sesiones.
//   totalHarvests     — cosechas totales acumuladas (conduce los desbloqueos).
//   unlockedCrops     — cuántos cultivos están desbloqueados (mínimo 1).
//   lastSavedAt       — marca de tiempo de la última escritura.
export interface SaveData {
    totalStars: number;
    totalHarvests: number;
    unlockedCrops: number;
    lastSavedAt: number;
}

export const saveManager = createSaveManager<SaveData>({
    version: 1,
    defaults: { totalStars: 0, totalHarvests: 0, unlockedCrops: 1, lastSavedAt: Date.now() }
});

export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    async create(): Promise<void> {
        await saveManager.load();

        AudioManager.init(this);

        Localization.registerDictionary('en', {
            play: 'PLAY',
            retry: 'PLAY AGAIN',
            done: 'DONE',
            sessionStars: "Today's stars",
            totalStars: 'Total',
            newCrop: 'New crop!',
            tapHint: 'Tap a patch to plant!'
        });
        Localization.registerDictionary('es', {
            play: 'JUGAR',
            retry: 'JUGAR OTRA VEZ',
            done: 'LISTO',
            sessionStars: 'Estrellas de hoy',
            totalStars: 'En total',
            newCrop: '¡Nuevo cultivo!',
            tapHint: '¡Toca un cuadro para sembrar!'
        });
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
