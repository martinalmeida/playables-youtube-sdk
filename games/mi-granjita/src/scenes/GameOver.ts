import Phaser from 'phaser';
import { YouTubePlayables } from '../lib/YouTubePlayables';
import { Button } from '../core/UIKit';
import { Localization } from '../core/Localization';
import { fadeToScene, fadeInScene } from '../core/SceneTransitions';

/**
 * GameOver — "Mi Granjita": resumen de la sesión. Es una granja sin derrota;
 * este es un cierre celebratorio con las estrellas ganadas en la sesión.
 * Envía sendScore() con las estrellas de la sesión y ofrece volver a jugar
 * (el progreso acumulado ya está guardado por saveManager en la escena Game).
 */
export class GameOver extends Phaser.Scene {
    private sessionStars = 0;
    private totalStars = 0;

    constructor() {
        super('GameOver');
    }

    init(data: { sessionStars?: number; totalStars?: number }): void {
        this.sessionStars = data?.sessionStars ?? 0;
        this.totalStars = data?.totalStars ?? this.sessionStars;
    }

    create(): void {
        fadeInScene(this);
        const { width, height } = this.scale;

        YouTubePlayables.sendScore(this.sessionStars);

        this.add
            .text(width / 2, height * 0.22, '🎉', {
                fontFamily: 'sans-serif',
                fontSize: '64px'
            })
            .setOrigin(0.5);

        this.add
            .text(width / 2, height * 0.34, `${Localization.t('sessionStars')}: ⭐ ${this.sessionStars}`, {
                fontFamily: 'sans-serif',
                fontSize: '34px',
                color: '#ffffff',
                stroke: '#5d4037',
                strokeThickness: 5
            })
            .setOrigin(0.5);

        this.add
            .text(width / 2, height * 0.45, `${Localization.t('totalStars')}: ⭐ ${this.totalStars}`, {
                fontFamily: 'sans-serif',
                fontSize: '26px',
                color: '#ffe9a8'
            })
            .setOrigin(0.5);

        const retryButton = new Button(this, width / 2, height * 0.65, `${Localization.t('retry')} 🚜`, {
            width: 280,
            height: 88,
            fontSize: '32px'
        });
        retryButton.on('pointerup', () => fadeToScene(this, 'Game'));
    }
}
