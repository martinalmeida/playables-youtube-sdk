import Phaser from 'phaser';
import { InputManager } from '../core/InputManager';
import { Button, ProgressBar } from '../core/UIKit';
import { popScale, floatingText } from '../core/Juice';
import { fadeToScene, fadeInScene } from '../core/SceneTransitions';
import { saveManager } from './Boot';

/**
 * Game (idle/clicker): demuestra el patrón central de un idle game —
 * progreso offline calculado a partir de `lastSavedAt` guardado por
 * SaveManager.
 *
 * TODO(agente): esta es la mecánica más simple posible (tap = +1 moneda,
 * generación pasiva por segundo). El "árbol de mejoras" real (comprar
 * generadores, multiplicadores, prestigio) es responsabilidad del agente
 * al construir el juego real sobre esta base.
 */
export class Game extends Phaser.Scene {
    private currency = 0;
    private perSecond = 1;
    private currencyText!: Phaser.GameObjects.Text;
    private upgradeProgress!: ProgressBar;
    private tapsSinceUpgrade = 0;
    private readonly tapsPerUpgrade = 20;

    constructor() {
        super('Game');
    }

    create(): void {
        fadeInScene(this);

        this.currency = saveManager.get('currency') ?? 0;
        this.perSecond = saveManager.get('perSecond') ?? 1;

        this.applyOfflineProgress();

        const { width, height } = this.scale;

        this.currencyText = this.add
            .text(width / 2, height * 0.2, this.formatCurrency(), {
                fontFamily: 'sans-serif',
                fontSize: '40px',
                color: '#ffffff'
            })
            .setOrigin(0.5);

        this.add
            .text(width / 2, height * 0.28, `+${this.perSecond}/seg`, {
                fontFamily: 'sans-serif',
                fontSize: '18px',
                color: '#9fb3d9'
            })
            .setOrigin(0.5);

        this.upgradeProgress = new ProgressBar(this, width / 2 - 100, height * 0.4, { width: 200 });

        const tapButton = new Button(this, width / 2, height * 0.6, 'TOCAR', { width: 180, height: 180 });
        tapButton.on('pointerup', () => this.onTap());

        const statsButton = new Button(this, width / 2, height * 0.85, 'Estadísticas', {
            width: 200,
            height: 56,
            fontSize: '20px'
        });
        statsButton.on('pointerup', () => {
            saveManager.set('currency', this.currency);
            saveManager.set('perSecond', this.perSecond);
            saveManager.saveImmediate();
            fadeToScene(this, 'GameOver', { currency: this.currency });
        });

        InputManager.attach(this);

        // Generación pasiva.
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                this.currency += this.perSecond;
                this.refreshCurrencyText();
                saveManager.set('currency', this.currency);
                saveManager.save();
            }
        });
    }

    private applyOfflineProgress(): void {
        const lastSavedAt = saveManager.get('lastSavedAt') ?? Date.now();
        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - lastSavedAt) / 1000));

        if (elapsedSeconds > 0) {
            const earned = elapsedSeconds * this.perSecond;
            this.currency += earned;

            if (earned > 0) {
                this.time.delayedCall(300, () => {
                    floatingText(
                        this,
                        this.scale.width / 2,
                        this.scale.height * 0.15,
                        `+${earned} (offline)`,
                        {
                            color: '#5b8cff',
                            durationMs: 1200
                        }
                    );
                });
            }
        }

        saveManager.set('lastSavedAt', Date.now());
    }

    private onTap(): void {
        this.currency += 1;
        this.tapsSinceUpgrade += 1;
        this.refreshCurrencyText();
        popScale(this, this.currencyText, 1.05);

        this.upgradeProgress.setProgress(this.tapsSinceUpgrade / this.tapsPerUpgrade);

        if (this.tapsSinceUpgrade >= this.tapsPerUpgrade) {
            this.tapsSinceUpgrade = 0;
            this.perSecond += 1;
            saveManager.set('perSecond', this.perSecond);
            floatingText(this, this.scale.width / 2, this.scale.height * 0.35, '¡Mejora!', {
                color: '#5b8cff'
            });
        }

        saveManager.set('currency', this.currency);
        saveManager.save();
    }

    private refreshCurrencyText(): void {
        this.currencyText.setText(this.formatCurrency());
    }

    private formatCurrency(): string {
        return Math.floor(this.currency).toLocaleString();
    }
}
