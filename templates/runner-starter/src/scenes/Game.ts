import Phaser from 'phaser';
import { InputManager } from '../core/InputManager';
import { EventBus } from '../core/EventBus';
import { createObjectPool, ObjectPool } from '../core/ObjectPool';
import { createStateMachine } from '../core/StateMachine';
import { screenShake, hitStop, floatingText } from '../core/Juice';
import { fadeToScene, fadeInScene } from '../core/SceneTransitions';

/**
 * Game (runner): endless runner minimalista.
 *
 * Demuestra:
 *  - InputManager: swipe hacia arriba (o tap) para saltar, funciona igual
 *    en mouse (desktop) y touch (móvil).
 *  - ObjectPool: los obstáculos se reciclan en vez de crear/destruir
 *    Game Objects constantemente — importante en un runner con spawns
 *    frecuentes.
 *  - StateMachine: estado del jugador ('running' | 'jumping' | 'dead').
 *  - Juice: screenShake + hitStop + floatingText al chocar.
 */
type PlayerState = 'running' | 'jumping' | 'dead';

export class Game extends Phaser.Scene {
    private player!: Phaser.GameObjects.Rectangle;
    private groundY = 0;
    private velocityY = 0;
    private readonly gravity = 1400;
    private readonly jumpVelocity = -650;

    private obstaclePool!: ObjectPool<Phaser.GameObjects.Rectangle>;
    private obstacles: Phaser.GameObjects.Rectangle[] = [];
    private spawnTimer = 0;
    private speed = 320;
    private score = 0;
    private scoreText!: Phaser.GameObjects.Text;

    private fsm = createStateMachine<PlayerState>({
        initial: 'running',
        states: {
            running: { on: { jump: 'jumping' } },
            jumping: { on: { land: 'running', hit: 'dead' } },
            dead: {}
        }
    });

    private onTapOrSwipe = (): void => this.tryJump();

    constructor() {
        super('Game');
    }

    create(): void {
        fadeInScene(this);

        const { width, height } = this.scale;
        this.groundY = height * 0.75;
        this.score = 0;
        this.spawnTimer = 0;

        this.add.rectangle(width / 2, this.groundY + 20, width, 4, 0x2a3550);

        this.player = this.add.rectangle(width * 0.2, this.groundY, 40, 40, 0x5b8cff);
        this.velocityY = 0;

        this.obstaclePool = createObjectPool<Phaser.GameObjects.Rectangle>({
            factory: () => this.add.rectangle(0, 0, 32, 48, 0xff5b6b).setActive(false).setVisible(false),
            reset: (obstacle, x: number, y: number) => {
                obstacle.setPosition(x, y).setActive(true).setVisible(true);
            },
            release: (obstacle) => {
                obstacle.setActive(false).setVisible(false);
            },
            initialSize: 6
        });

        this.scoreText = this.add.text(24, 24, 'Puntaje: 0', {
            fontFamily: 'sans-serif',
            fontSize: '24px',
            color: '#ffffff'
        });

        InputManager.attach(this);
        EventBus.on('input:tap', this.onTapOrSwipe);
        EventBus.on('input:swipe', ({ direction }: { direction: string }) => {
            if (direction === 'up') this.tryJump();
        });
    }

    private tryJump(): void {
        if (!this.fsm.is('running')) return;
        this.velocityY = this.jumpVelocity;
        this.fsm.send('jump');
    }

    update(_time: number, deltaMs: number): void {
        if (this.fsm.is('dead')) return;

        const delta = deltaMs / 1000;

        // Física simple de salto (sin Arcade Physics, para mantener el
        // ejemplo mínimo y fácil de leer/extender).
        if (!this.fsm.is('running')) {
            this.velocityY += this.gravity * delta;
            this.player.y += this.velocityY * delta;

            if (this.player.y >= this.groundY) {
                this.player.y = this.groundY;
                this.velocityY = 0;
                this.fsm.send('land');
            }
        }

        // Spawn de obstáculos.
        this.spawnTimer -= delta;
        if (this.spawnTimer <= 0) {
            const { width } = this.scale;
            const obstacle = this.obstaclePool.acquire(width + 40, this.groundY - 12);
            this.obstacles.push(obstacle);
            this.spawnTimer = Phaser.Math.FloatBetween(1.0, 1.8);
        }

        // Mover y reciclar obstáculos; detectar colisión simple por AABB.
        this.obstacles = this.obstacles.filter((obstacle) => {
            obstacle.x -= this.speed * delta;

            const hit =
                Math.abs(obstacle.x - this.player.x) < 30 && Math.abs(obstacle.y - this.player.y) < 30;

            if (hit && this.fsm.is('running')) {
                this.onCollision();
            }

            if (obstacle.x < -40) {
                this.obstaclePool.release(obstacle);
                this.score += 1;
                this.scoreText.setText(`Puntaje: ${this.score}`);
                return false;
            }

            return true;
        });

        this.speed += 4 * delta; // dificultad progresiva
    }

    private onCollision(): void {
        this.fsm.send('hit');
        screenShake(this, 200, 0.015);
        hitStop(this, 80);
        floatingText(this, this.player.x, this.player.y - 30, '¡Choque!', { color: '#ff5b6b' });

        this.time.delayedCall(300, () => {
            fadeToScene(this, 'GameOver', { score: this.score });
        });
    }

    shutdown(): void {
        EventBus.off('input:tap', this.onTapOrSwipe);
        this.obstaclePool?.releaseAll();
        this.obstacles = [];
    }
}
