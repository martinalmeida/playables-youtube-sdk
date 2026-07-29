import Phaser from 'phaser';
import { Button } from '../core/UIKit';
import { Localization } from '../core/Localization';
import { fadeToScene, fadeInScene } from '../core/SceneTransitions';
import { saveManager } from './Boot';

/**
 * GameOver (idle): en un idle/clicker no hay "fin de partida" real — esta
 * escena funciona como pantalla de estadísticas/reinicio (patrón común de
 * "prestigio"). Se mantiene el nombre GameOver por consistencia con el
 * resto de templates (ver SKILLS/phaser-scene-scaffolding/SKILL.md).
 */
export class GameOver extends Phaser.Scene {
    private currency = 0;

    constructor() {
        super('GameOver');
    }

    init(data: { currency?: number }): void {
        this.currency = data?.currency ?? saveManager.get('currency') ?? 0;
    }

    create(): void {
        fadeInScene(this);
        const { width, height } = this.scale;

        this.add
            .text(width / 2, height * 0.4, `Total acumulado: ${Math.floor(this.currency).toLocaleString()}`, {
                fontFamily: 'sans-serif',
                fontSize: '30px',
                color: '#ffffff'
            })
            .setOrigin(0.5);

        this.add
            .text(width / 2, height * 0.48, `Generación: +${saveManager.get('perSecond') ?? 1}/seg`, {
                fontFamily: 'sans-serif',
                fontSize: '20px',
                color: '#9fb3d9'
            })
            .setOrigin(0.5);

        const backButton = new Button(this, width / 2, height * 0.62, Localization.t('retry'));
        backButton.on('pointerup', () => fadeToScene(this, 'Game'));
    }
}
