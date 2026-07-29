import Phaser from 'phaser';
import { YouTubePlayables } from './lib/YouTubePlayables';
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { Game } from './scenes/Game';
import { GameOver } from './scenes/GameOver';

/**
 * Config base. Scale.RESIZE + contenedor a 100% del viewport cumple el
 * requisito de "jugable desde 9:16 hasta 21:9, ocupando toda la ventana".
 * Ver SKILLS/responsive-design/SKILL.md antes de tocar este bloque.
 */
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#0b0e14',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    },
    scene: [Boot, Preloader, MainMenu, Game, GameOver]
};

async function start(): Promise<void> {
    // Solo en dev: instala un SDK simulado si no hay uno real disponible
    // (Test Suite o YouTube). Se elimina completamente del bundle de
    // producción vía tree-shaking de Vite.
    if (import.meta.env.DEV) {
        const { installMockSdk } = await import('./dev/mockYtGame');
        installMockSdk();
    }

    // Nunca instanciar Phaser.Game antes de que el SDK (o el timeout de
    // modo standalone) confirme que está listo.
    YouTubePlayables.boot(() => {
        new Phaser.Game(config);
    });
}

start();
