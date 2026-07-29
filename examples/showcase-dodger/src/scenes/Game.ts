import Phaser from 'phaser';
import { InputManager } from '../core/InputManager';
import { EventBus } from '../core/EventBus';
import { AudioManager } from '../core/AudioManager';
import { createObjectPool, ObjectPool } from '../core/ObjectPool';
import { createStateMachine } from '../core/StateMachine';
import { screenShake, hitStop, floatingText, popScale } from '../core/Juice';
import { fadeToScene, fadeInScene } from '../core/SceneTransitions';
import { ShapeSprites } from '../core/ShapeSprites';
import { ParticlePresets } from '../core/ParticlePresets';
import { showPauseMenu } from '../core/UIOverlays';
import { A11Y_PALETTE, warnIfBelowMinTouchTarget } from '../core/Accessibility';
import { PerformanceMonitor } from '../core/PerformanceMonitor';
import { loadLevel } from '../core/LevelLoader';
import { Button } from '../core/UIKit';

/**
 * Game (showcase): "Meteor Dodger" — juego de referencia que demuestra
 * TODOS los sistemas del SDK trabajando juntos. No es un template para
 * copiar ciegamente: es el "few-shot" que muestra el patrón de composición
 * completo. Ver README.md > "Juego de referencia" para el detalle de qué
 * sistema hace qué aquí.
 *
 * Mecánica: el jugador arrastra su nave horizontalmente para esquivar
 * meteoros que caen (ObjectPool) y recoger estrellas de puntos. Dificultad
 * data-driven (LevelLoader), calidad de partículas adaptativa según FPS
 * (PerformanceMonitor), pausa manual con menú (UIOverlays), sonidos
 * sintetizados (SfxSynth vía AudioManager), y feedback visual redundante
 * al audio (Accessibility).
 */
interface DifficultyConfig {
    fallSpeed: number;
    spawnIntervalMinMs: number;
    spawnIntervalMaxMs: number;
    coinChance: number;
}

type FallingKind = 'meteor' | 'coin';

interface FallingObject {
    sprite: Phaser.GameObjects.Image;
    kind: FallingKind;
}

export class Game extends Phaser.Scene {
    private player!: Phaser.GameObjects.Image;
    private playerTargetX = 0;
    private difficulty!: DifficultyConfig;
    private pool!: ObjectPool<FallingObject>;
    private falling: FallingObject[] = [];
    private spawnTimer = 0;
    private score = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private lowQuality = false;

    private fsm = createStateMachine<'alive' | 'dead'>({
        initial: 'alive',
        states: { alive: { on: { hit: 'dead' } }, dead: {} }
    });

    constructor() {
        super('Game');
    }

    async create(): Promise<void> {
        fadeInScene(this);
        this.score = 0;

        this.difficulty = await loadLevel<DifficultyConfig>('levels/difficulty.json', [
            'fallSpeed',
            'spawnIntervalMinMs',
            'spawnIntervalMaxMs',
            'coinChance'
        ]);

        // Texturas procedurales — sin archivos de imagen (ShapeSprites).
        ShapeSprites.circle(this, 'meteor', { radius: 22, color: 0x8a8f9e, strokeColor: 0x555b6e, strokeWidth: 3 });
        ShapeSprites.star(this, 'coin-star', { radius: 16, color: A11Y_PALETTE.warning });
        ShapeSprites.circle(this, 'player-ship', { radius: 20, color: A11Y_PALETTE.accent });

        const { width, height } = this.scale;
        this.playerTargetX = width / 2;
        this.player = this.add.image(this.playerTargetX, height * 0.85, 'player-ship');

        this.scoreText = this.add.text(24, 24, 'Puntaje: 0', {
            fontFamily: 'sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        });

        const pauseButton = new Button(this, width - 50, 40, '⏸', { width: 56, height: 56, fontSize: '22px' });
        warnIfBelowMinTouchTarget(56, 56, 'botón de pausa'); // cumple, pero demuestra el chequeo (Accessibility)
        pauseButton.on('pointerup', () => this.openPauseMenu());

        this.pool = createObjectPool<FallingObject>({
            factory: () => ({
                sprite: this.add.image(0, 0, 'meteor').setActive(false).setVisible(false),
                kind: 'meteor'
            }),
            reset: (obj, x: number, y: number, kind: FallingKind) => {
                obj.kind = kind;
                obj.sprite.setTexture(kind === 'meteor' ? 'meteor' : 'coin-star');
                obj.sprite.setPosition(x, y).setActive(true).setVisible(true);
            },
            release: (obj) => obj.sprite.setActive(false).setVisible(false),
            initialSize: 8
        });

        InputManager.attach(this);
        EventBus.on<{ x: number }>('input:drag', ({ x }) => {
            this.playerTargetX = Phaser.Math.Clamp(x, 30, width - 30);
        });

        PerformanceMonitor.attach(this);
        EventBus.on<string>('performance:qualitychange', (level) => {
            this.lowQuality = level === 'low';
        });
    }

    update(_time: number, deltaMs: number): void {
        if (this.fsm.is('dead') || this.isPaused) return;
        const delta = deltaMs / 1000;

        // Movimiento suave hacia la posición objetivo del drag.
        this.player.x = Phaser.Math.Linear(this.player.x, this.playerTargetX, 0.25);

        this.spawnTimer -= delta;
        if (this.spawnTimer <= 0) {
            this.spawnFallingObject();
            this.spawnTimer =
                Phaser.Math.Between(this.difficulty.spawnIntervalMinMs, this.difficulty.spawnIntervalMaxMs) / 1000;
        }

        this.falling = this.falling.filter((obj) => {
            obj.sprite.y += this.difficulty.fallSpeed * delta;

            const dist = Phaser.Math.Distance.Between(obj.sprite.x, obj.sprite.y, this.player.x, this.player.y);
            if (dist < 28) {
                this.onOverlap(obj);
                this.pool.release(obj);
                return false;
            }

            if (obj.sprite.y > this.scale.height + 30) {
                this.pool.release(obj);
                return false;
            }

            return true;
        });
    }

    private spawnFallingObject(): void {
        const { width } = this.scale;
        const x = Phaser.Math.Between(30, width - 30);
        const kind: FallingKind = Math.random() < this.difficulty.coinChance ? 'coin' : 'meteor';
        const obj = this.pool.acquire(x, -30, kind);
        this.falling.push(obj);
    }

    private onOverlap(obj: FallingObject): void {
        if (obj.kind === 'coin') {
            this.score += 5;
            this.scoreText.setText(`Puntaje: ${this.score}`);
            AudioManager.playSynth('coin');
            floatingText(this, obj.sprite.x, obj.sprite.y, '+5', { color: '#ffd166' });
            if (!this.lowQuality) ParticlePresets.spark(this, obj.sprite.x, obj.sprite.y, 0xffd166);
            popScale(this, this.scoreText, 1.1);
        } else {
            this.fsm.send('hit');
            AudioManager.playSynth('explosion');
            screenShake(this, 200, 0.02);
            hitStop(this, 80);
            if (!this.lowQuality) ParticlePresets.smoke(this, obj.sprite.x, obj.sprite.y);
            floatingText(this, this.player.x, this.player.y - 30, '¡Impacto!', { color: '#ff5b6b' });

            this.time.delayedCall(400, () => {
                fadeToScene(this, 'GameOver', { score: this.score });
            });
        }
    }

    private isPaused = false;

    private openPauseMenu(): void {
        // NOTA: deliberadamente NO usamos this.scene.pause() aquí — Phaser
        // deja de procesar input en una escena pausada, lo que rompería el
        // propio botón "reanudar" del menú. En su lugar, una bandera manual
        // detiene la lógica de update() mientras el menú sigue siendo
        // interactivo.
        this.isPaused = true;
        showPauseMenu(this, {
            onResume: () => {
                this.isPaused = false;
            }
        });
    }
}
