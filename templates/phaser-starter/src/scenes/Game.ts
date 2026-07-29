import Phaser from 'phaser';
import { InputManager } from '../core/InputManager';
import { EventBus } from '../core/EventBus';
import { AudioManager } from '../core/AudioManager';
import { fadeToScene, fadeInScene } from '../core/SceneTransitions';
import { floatingText } from '../core/Juice';

/**
 * Game: mecánica real del juego. No llama directamente a hooks del ciclo de
 * vida del SDK — eso está centralizado en Boot/Preloader/MainMenu.
 *
 * TODO(agente): reemplazar este placeholder por la mecánica real definida
 * por el usuario. Usa InputManager/EventBus para gestos, ObjectPool si hay
 * objetos efímeros, StateMachine si hay estados de personaje/enemigo.
 */
export class Game extends Phaser.Scene {
    private score = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private onTap = ({ x, y }: { x: number; y: number }): void => {
        this.score += 1;
        this.scoreText.setText(`Puntaje: ${this.score}`);
        floatingText(this, x, y, '+1', { color: '#5b8cff' });
        AudioManager.playSynth('coin');

        if (this.score >= 10) {
            AudioManager.playSynth('win');
            fadeToScene(this, 'GameOver', { score: this.score });
        }
    };

    constructor() {
        super('Game');
    }

    create(): void {
        fadeInScene(this);
        this.score = 0;

        this.scoreText = this.add.text(24, 24, 'Puntaje: 0', {
            fontFamily: 'sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        });

        InputManager.attach(this);
        EventBus.on<{ x: number; y: number }>('input:tap', this.onTap);

        this.scale.on('resize', this.handleResize, this);
    }

    private handleResize(): void {
        // TODO(agente): recolocar UI/gameplay al cambiar el viewport.
    }

    shutdown(): void {
        EventBus.off('input:tap', this.onTap);
        this.scale.off('resize', this.handleResize, this);
    }
}
