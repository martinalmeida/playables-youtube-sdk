import Phaser from 'phaser';
import { YouTubePlayables } from '../lib/YouTubePlayables';
import { Button } from '../core/UIKit';
import { Localization } from '../core/Localization';
import { fadeToScene, fadeInScene } from '../core/SceneTransitions';
import { ShapeSprites } from '../core/ShapeSprites';

/**
 * MainMenu: primer punto donde el usuario puede interactuar. Aquí, y no
 * antes, se llama gameReady().
 */
export class MainMenu extends Phaser.Scene {
    private titleText!: Phaser.GameObjects.Text;
    private playButton!: Button;
    private skyBg!: Phaser.GameObjects.Image;

    constructor() {
        super('MainMenu');
    }

    create(): void {
        fadeInScene(this);
        const { width, height } = this.scale;

        this.createBackground();

        this.titleText = this.add
            .text(width / 2, height * 0.32, '🚜  Mi Granjita', {
                fontFamily: 'sans-serif',
                fontSize: '52px',
                color: '#ffffff',
                backgroundColor: '#3a6b35cc',
                padding: { x: 20, y: 14 },
                stroke: '#1f3d1c',
                strokeThickness: 6
            })
            .setOrigin(0.5);

        this.add
            .text(width / 2, height * 0.44, '🌾 🐔 🐮', {
                fontFamily: 'sans-serif',
                fontSize: '40px'
            })
            .setOrigin(0.5);

        this.playButton = new Button(this, width / 2, height * 0.62, Localization.t('play'), {
            width: 260,
            height: 96,
            fontSize: '40px'
        });
        this.playButton.on('pointerup', () => fadeToScene(this, 'Game'));

        this.scale.on('resize', this.handleResize, this);
        YouTubePlayables.gameReady();
    }

    private createBackground(): void {
        const { width, height } = this.scale;
        ShapeSprites.gradientRect(this, 'sky', {
            width: width,
            height: height,
            colorStart: 0x8fd3ff,
            colorEnd: 0xd9f5ff,
            direction: 'vertical'
        });
        this.skyBg = this.add
            .image(width / 2, height / 2, 'sky')
            .setDisplaySize(width, height)
            .setDepth(-10);

        // Sol decorativo en la esquina superior derecha.
        ShapeSprites.circle(this, 'sun', { radius: 42, color: 0xffd166 });
        this.add.image(width - 60, 70, 'sun').setDepth(-5);
    }

    private handleResize(gameSize: Phaser.Structs.Size): void {
        const { width, height } = gameSize;
        this.titleText.setPosition(width / 2, height * 0.32);
        this.playButton.setPosition(width / 2, height * 0.62);

        ShapeSprites.gradientRect(this, 'sky', {
            width: width,
            height: height,
            colorStart: 0x8fd3ff,
            colorEnd: 0xd9f5ff,
            direction: 'vertical'
        });
        this.skyBg.setDisplaySize(width, height);
        this.skyBg.setPosition(width / 2, height / 2);
    }

    shutdown(): void {
        this.scale.off('resize', this.handleResize, this);
    }
}
