import Phaser from 'phaser';
import { YouTubePlayables } from '../lib/YouTubePlayables';
import { Button } from '../core/UIKit';
import { Localization } from '../core/Localization';
import { fadeToScene, fadeInScene } from '../core/SceneTransitions';

/**
 * MainMenu: primer punto donde el usuario puede interactuar. Aquí, y no
 * antes, se llama gameReady().
 */
export class MainMenu extends Phaser.Scene {
    private titleText!: Phaser.GameObjects.Text;
    private playButton!: Button;

    constructor() {
        super('MainMenu');
    }

    create(): void {
        fadeInScene(this);
        const { width, height } = this.scale;

        // TODO(agente): reemplazar por el título/logo real del juego.
        this.titleText = this.add
            .text(width / 2, height * 0.35, '__GAME_TITLE__', {
                fontFamily: 'sans-serif',
                fontSize: '48px',
                color: '#ffffff'
            })
            .setOrigin(0.5);

        this.playButton = new Button(this, width / 2, height * 0.6, Localization.t('play'));
        this.playButton.on('pointerup', () => fadeToScene(this, 'Game'));

        this.scale.on('resize', this.handleResize, this);
        YouTubePlayables.gameReady();
    }

    private handleResize(gameSize: Phaser.Structs.Size): void {
        const { width, height } = gameSize;
        this.titleText.setPosition(width / 2, height * 0.35);
        this.playButton.setPosition(width / 2, height * 0.6);
    }

    shutdown(): void {
        this.scale.off('resize', this.handleResize, this);
    }
}
