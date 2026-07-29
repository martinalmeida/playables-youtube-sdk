import Phaser from 'phaser';
import { YouTubePlayables } from '../lib/YouTubePlayables';

/**
 * Preloader: carga todos los assets de gameplay. En cuanto hay algo visible
 * en pantalla, se notifica firstFrameReady() al SDK.
 */
export class Preloader extends Phaser.Scene {
    constructor() {
        super('Preloader');
    }

    init(): void {
        this.createLoadingBar();
        YouTubePlayables.firstFrameReady();
    }

    private createLoadingBar(): void {
        const { width, height } = this.scale;
        const barWidth = Math.min(400, width * 0.6);
        const barHeight = 24;
        const x = width / 2 - barWidth / 2;
        const y = height / 2 - barHeight / 2;

        this.add.rectangle(width / 2, height / 2, barWidth + 8, barHeight + 8, 0x222833);
        const bar = this.add.rectangle(x, y, 4, barHeight, 0x5b8cff).setOrigin(0, 0);

        this.load.on('progress', (value: number) => {
            bar.width = 4 + (barWidth - 4) * value;
        });
    }

    preload(): void {
        // TODO(agente): registrar aquí los assets reales del juego.
        // Embebidos (bundleados por Vite):
        //   import logoImg from '../assets/logo.png';
        //   this.load.image('logo', logoImg);
        // Estáticos desde /public/assets:
        //   this.load.image('background', 'assets/background.png');
        // Ver SKILLS/asset-pipeline/SKILL.md.
    }

    create(): void {
        this.scene.start('MainMenu');
    }
}
