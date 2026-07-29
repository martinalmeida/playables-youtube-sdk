import Phaser from 'phaser';
import { YouTubePlayables } from '../lib/YouTubePlayables';
import { saveManager } from './Boot';
import { Button } from '../core/UIKit';
import { Localization } from '../core/Localization';
import { fadeToScene, fadeInScene } from '../core/SceneTransitions';

/**
 * GameOver: envía el puntaje final y guarda el progreso vía saveManager
 * (esquema versionado centralizado en Boot.ts).
 */
export class GameOver extends Phaser.Scene {
    private finalScore = 0;

    constructor() {
        super('GameOver');
    }

    init(data: { score?: number }): void {
        this.finalScore = data?.score ?? 0;
    }

    create(): void {
        fadeInScene(this);
        const { width, height } = this.scale;

        YouTubePlayables.sendScore(this.finalScore);

        const bestScore = Math.max(saveManager.get('bestScore') ?? 0, this.finalScore);
        saveManager.set('bestScore', bestScore);
        saveManager.save();

        this.add
            .text(width / 2, height * 0.4, `Puntaje final: ${this.finalScore}`, {
                fontFamily: 'sans-serif',
                fontSize: '32px',
                color: '#ffffff'
            })
            .setOrigin(0.5);

        this.add
            .text(width / 2, height * 0.5, `Mejor puntaje: ${bestScore}`, {
                fontFamily: 'sans-serif',
                fontSize: '24px',
                color: '#9fb3d9'
            })
            .setOrigin(0.5);

        const retryButton = new Button(this, width / 2, height * 0.65, Localization.t('retry'));
        retryButton.on('pointerup', () => fadeToScene(this, 'Game'));
    }
}
