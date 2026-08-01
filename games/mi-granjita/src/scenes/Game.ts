import Phaser from 'phaser';
import { saveManager } from './Boot';
import { AudioManager } from '../core/AudioManager';
import { Localization } from '../core/Localization';
import { Button, ProgressBar } from '../core/UIKit';
import { popScale, floatingText } from '../core/Juice';
import { ParticlePresets } from '../core/ParticlePresets';
import { ShapeSprites } from '../core/ShapeSprites';
import { fadeToScene, fadeInScene } from '../core/SceneTransitions';
import { showToast } from '../core/UIOverlays';
import {
    CROPS,
    ANIMALS,
    WATER_BOOST_FRACTION,
    type CropDefinition,
    type AnimalDefinition
} from '../game/FarmModels';

/**
 * Game — "Mi Granjita": la granja de una sola pantalla.
 *
 * Todo el gameplay (cultivos + animales) vive en un grupo escalado a partir
 * de un espacio de referencia vertical (REF_W x REF_H), centrado en el
 * viewport, de modo que el juego se ve y se juega igual desde 9:16 hasta
 * 21:9. Los fondos (cielo, suelo, sol, nubes) se dibujan en coordenadas
 * absolutas para cubrir cualquier tamaño de canvas.
 *
 * No toca hooks del ciclo de vida del SDK (eso vive en Boot); aquí solo
 * hay lógica de juego y persistencia incremental vía saveManager.
 */

const REF_W = 480;
const REF_H = 900;
const PLOT_SIZE = 96;
const PLOT_GAP = 28;
const PLOT_ROWS_Y = [-42, 82];
const ANIMALS_Y = 380;
const ANIMAL_SIZE = 96;
const ANIMAL_SPACING = 125;
const WATER_BOOST = WATER_BOOST_FRACTION;

type PlotState = 'empty' | 'growing' | 'ready';

interface PlotSlot {
    container: Phaser.GameObjects.Container;
    emoji: Phaser.GameObjects.Text;
    bar: ProgressBar;
    state: PlotState;
    crop: CropDefinition;
    progress: number;
    bobTween?: Phaser.Tweens.Tween;
}

type AnimalState = 'idle' | 'hungry' | 'producing' | 'ready';

interface AnimalSlot {
    def: AnimalDefinition;
    container: Phaser.GameObjects.Container;
    emoji: Phaser.GameObjects.Text;
    bubble: Phaser.GameObjects.Text;
    product: Phaser.GameObjects.Text;
    bar: ProgressBar;
    state: AnimalState;
    hungerTimer?: Phaser.Time.TimerEvent;
    bubbleTween?: Phaser.Tweens.Tween;
    produceStartedAt?: number;
}

export class Game extends Phaser.Scene {
    private group!: Phaser.GameObjects.Container;
    private plots: PlotSlot[] = [];
    private animals: AnimalSlot[] = [];
    private hintText!: Phaser.GameObjects.Text;
    private starText!: Phaser.GameObjects.Text;
    private doneButton!: Button;
    private skyBg!: Phaser.GameObjects.Image;
    private sun!: Phaser.GameObjects.Image;
    private ground!: Phaser.GameObjects.Rectangle;
    private clouds: Phaser.GameObjects.Container[] = [];

    private totalStars = 0;
    private sessionStars = 0;
    private totalHarvests = 0;
    private hintShown = true;

    constructor() {
        super('Game');
    }

    create(): void {
        fadeInScene(this);

        this.totalStars = saveManager.get('totalStars') ?? 0;
        this.totalHarvests = saveManager.get('totalHarvests') ?? 0;

        this.createBackground();
        this.createHud();

        this.group = this.add.container(0, 0);
        this.createPlots();
        this.createAnimals();

        this.hintText = this.add
            .text(0, -130, Localization.t('tapHint'), {
                fontFamily: 'sans-serif',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#3a6b35',
                strokeThickness: 5
            })
            .setOrigin(0.5);
        this.group.add(this.hintText);

        this.scale.on('resize', this.handleResize, this);
        this.handleResize();
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
        this.skyBg = this.add.image(0, 0, 'sky').setOrigin(0, 0).setDepth(-20);

        this.ground = this.add
            .rectangle(0, 0, width, height * 0.62, 0x7cb342)
            .setOrigin(0.5)
            .setDepth(-15);

        ShapeSprites.circle(this, 'sun', { radius: 42, color: 0xffd166 });
        this.sun = this.add.image(width - 60, 70, 'sun').setDepth(-12);

        ShapeSprites.circle(this, 'cloud', { radius: 28, color: 0xffffff });
        const makeCloud = (fx: number, fy: number): Phaser.GameObjects.Container => {
            const cloud = this.add.container(width * fx, height * fy);
            cloud.setDepth(-10);
            cloud.add(this.add.image(0, 0, 'cloud'));
            cloud.add(this.add.image(-30, 12, 'cloud').setScale(0.8));
            cloud.add(this.add.image(30, 12, 'cloud').setScale(0.8));
            return cloud;
        };
        this.clouds = [makeCloud(0.2, 0.1), makeCloud(0.75, 0.16), makeCloud(0.45, 0.05)];
    }

    private createHud(): void {
        this.starText = this.add
            .text(20, 16, `⭐ ${this.totalStars}`, {
                fontFamily: 'sans-serif',
                fontSize: '34px',
                color: '#ffffff',
                stroke: '#5d4037',
                strokeThickness: 5
            })
            .setDepth(10);

        this.doneButton = new Button(this, 0, 0, Localization.t('done'), {
            width: 120,
            height: 56,
            fontSize: '22px'
        });
        this.doneButton.setDepth(10);
        this.doneButton.on('pointerup', () => {
            this.finishSession();
        });
    }

    private createPlots(): void {
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 3; col++) {
                const x = (col - 1) * (PLOT_SIZE + PLOT_GAP);
                const y = PLOT_ROWS_Y[row];

                const container = this.add.container(x, y);
                const dirt = this.add
                    .rectangle(0, 0, PLOT_SIZE, PLOT_SIZE, 0x8d6e63)
                    .setStrokeStyle(6, 0x5d4037);
                const emoji = this.makeEmoji('', 56, 0, -6);
                const bar = new ProgressBar(this, 0, PLOT_SIZE / 2 + 16, {
                    width: 72,
                    height: 12,
                    fillColor: 0x6ee7b7
                });
                container.add([dirt, emoji, bar]);

                const slot: PlotSlot = {
                    container,
                    emoji,
                    bar,
                    state: 'empty',
                    crop: CROPS[0],
                    progress: 0
                };

                dirt.setInteractive({ useHandCursor: true });
                dirt.on('pointerup', () => this.onPlotTap(slot));

                this.plots.push(slot);
                this.group.add(container);
            }
        }
    }

    private createAnimals(): void {
        ANIMALS.forEach((def, i) => {
            const x = (i - 1.5) * ANIMAL_SPACING;
            const container = this.add.container(x, ANIMALS_Y);

            const emoji = this.makeEmoji(def.emoji, 64, 0, 0);
            const hit = this.add.rectangle(0, 0, ANIMAL_SIZE, ANIMAL_SIZE, 0x000000, 0.01).setInteractive({
                useHandCursor: true
            });
            const bubble = this.makeEmoji('', 40, 0, -64).setVisible(false);
            const product = this.makeEmoji(def.productEmoji, 44, 0, -74).setVisible(false).setInteractive({
                useHandCursor: true
            });
            const bar = new ProgressBar(this, 0, ANIMAL_SIZE / 2 + 20, {
                width: 80,
                height: 12,
                fillColor: 0xffd166
            });

            container.add([emoji, hit, bubble, product, bar]);

            const slot: AnimalSlot = { def, container, emoji, bubble, product, bar, state: 'idle' };

            hit.on('pointerup', () => this.onAnimalTap(slot));
            product.on('pointerup', () => this.onProductTap(slot));

            this.animals.push(slot);
            this.group.add(container);

            slot.hungerTimer = this.time.delayedCall(def.hungryAfterMs, () => this.setHungry(slot));
        });
    }

    private makeEmoji(text: string, sizePx: number, x: number, y: number): Phaser.GameObjects.Text {
        return this.add
            .text(x, y, text, { fontFamily: 'sans-serif', fontSize: `${sizePx}px` })
            .setOrigin(0.5);
    }

    /** Convierte coords locales del grupo (espacio REF) a coords absolutas del canvas. */
    private toWorld(lx: number, ly: number): { x: number; y: number } {
        const { width, height } = this.scale;
        const s = Math.min(width / REF_W, height / REF_H);
        return { x: width / 2 + lx * s, y: height / 2 + ly * s };
    }

    // ---------------------------------------------------------------- crops

    private onPlotTap(slot: PlotSlot): void {
        if (slot.state === 'empty') {
            this.plant(slot);
        } else if (slot.state === 'growing') {
            this.water(slot);
        } else {
            this.harvest(slot);
        }
    }

    private plant(slot: PlotSlot): void {
        const crop = CROPS[saveManager.get('unlockedCrops') - 1] ?? CROPS[0];
        slot.crop = crop;
        slot.state = 'growing';
        slot.progress = 0;
        slot.emoji.setText(crop.seedEmoji).setVisible(true);
        slot.bar.setProgress(0);
        slot.bar.setVisible(true);

        popScale(this, slot.emoji, 1.25);
        AudioManager.playSynth('click');

        if (this.hintShown) {
            this.hintShown = false;
            this.tweens.add({
                targets: this.hintText,
                alpha: 0,
                duration: 300,
                onComplete: () => this.hintText.destroy()
            });
        }
    }

    private water(slot: PlotSlot): void {
        slot.progress += WATER_BOOST;
        const { x, y } = this.toWorld(0, -30);
        floatingText(this, x, y, '💧', { fontSize: '28px', durationMs: 600 });
        const plotPos = this.toWorld(0, 0);
        ParticlePresets.spark(this, plotPos.x, plotPos.y, 0x8fd3ff);
        AudioManager.playSynth('jump');

        if (slot.progress >= 1) {
            this.setPlotReady(slot);
        } else {
            this.refreshGrowthVisual(slot);
        }
    }

    private setPlotReady(slot: PlotSlot): void {
        if (slot.state !== 'growing') return;
        slot.state = 'ready';
        slot.progress = 1;
        slot.emoji.setText(slot.crop.readyEmoji);
        slot.bar.setVisible(false);
        popScale(this, slot.emoji, 1.3);
        slot.bobTween = this.tweens.add({
            targets: slot.emoji,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 320,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private refreshGrowthVisual(slot: PlotSlot): void {
        slot.bar.setProgress(slot.progress);
        slot.emoji.setText(slot.progress < 0.35 ? slot.crop.seedEmoji : slot.crop.sproutEmoji);
    }

    private harvest(slot: PlotSlot): void {
        slot.bobTween?.stop();
        slot.emoji.setScale(1);
        slot.emoji.setText('').setVisible(false);
        slot.bar.setVisible(false);
        slot.state = 'empty';
        slot.progress = 0;

        this.addStars(1);
        this.totalHarvests += 1;
        saveManager.set('totalHarvests', this.totalHarvests);
        saveManager.save();

        const { x, y } = this.toWorld(0, -20);
        floatingText(this, x, y, '+1', { color: '#ffd166', fontSize: '32px', durationMs: 700 });
        const plotPos = this.toWorld(0, 0);
        ParticlePresets.spark(this, plotPos.x, plotPos.y, 0xffd166);
        AudioManager.playSynth('coin');

        this.checkUnlocks();
    }

    private checkUnlocks(): void {
        const unlocked = CROPS.filter((c) => c.unlockAtHarvests <= this.totalHarvests).length;
        if (unlocked > (saveManager.get('unlockedCrops') ?? 1)) {
            saveManager.set('unlockedCrops', unlocked);
            saveManager.save();

            const newCrop = CROPS[unlocked - 1];
            const { width, height } = this.scale;
            ParticlePresets.confetti(this, width / 2, height * 0.4);
            showToast(this, `${Localization.t('newCrop')} ${newCrop.readyEmoji}`, { color: '#ffd166' });
            AudioManager.playSynth('win');
        }
    }

    // --------------------------------------------------------------- animals

    private setHungry(slot: AnimalSlot): void {
        if (slot.state !== 'idle') return;
        slot.state = 'hungry';
        slot.bubble.setText('🌾').setVisible(true);
        slot.bubbleTween = this.tweens.add({
            targets: slot.bubble,
            y: -74,
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private onAnimalTap(slot: AnimalSlot): void {
        if (slot.state === 'hungry') {
            slot.bubbleTween?.stop();
            slot.bubble.setVisible(false);
            slot.bubble.setY(-64);
            slot.state = 'producing';
            slot.produceStartedAt = this.time.now;
            slot.bar.setProgress(0);
            slot.bar.setVisible(true);
            popScale(this, slot.emoji, 1.2);
            AudioManager.playSynth('click');
        } else if (slot.state !== 'ready') {
            // Caricias: sin coste, refuerza tocar a los animales.
            const { x, y } = this.toWorld(0, -90);
            floatingText(this, x, y, '💖', { fontSize: '30px', durationMs: 700 });
            popScale(this, slot.emoji, 1.15);
            AudioManager.playSynth('powerup');
        }
    }

    private onProductTap(slot: AnimalSlot): void {
        if (slot.state !== 'ready') return;

        slot.product.setVisible(false);
        slot.bar.setVisible(false);
        slot.state = 'idle';

        this.addStars(1);
        const { x, y } = this.toWorld(0, -100);
        floatingText(this, x, y, '+1', { color: '#ffd166', fontSize: '32px', durationMs: 700 });
        const productPos = this.toWorld(0, -74);
        ParticlePresets.spark(this, productPos.x, productPos.y, 0xffd166);
        AudioManager.playSynth('coin');

        slot.hungerTimer = this.time.delayedCall(slot.def.hungryAfterMs, () => this.setHungry(slot));
    }

    private setProductReady(slot: AnimalSlot): void {
        slot.state = 'ready';
        slot.bar.setVisible(false);
        slot.product.setVisible(true);
        popScale(this, slot.product, 1.3);
        AudioManager.playSynth('powerup');
    }

    // --------------------------------------------------------------- shared

    private addStars(n: number): void {
        this.totalStars += n;
        this.sessionStars += n;
        this.starText.setText(`⭐ ${this.totalStars}`);
        saveManager.set('totalStars', this.totalStars);
        saveManager.set('lastSavedAt', Date.now());
        saveManager.save();
        popScale(this, this.starText, 1.1);
    }

    private finishSession(): void {
        saveManager.set('lastSavedAt', Date.now());
        saveManager.saveImmediate();
        fadeToScene(this, 'GameOver', { sessionStars: this.sessionStars, totalStars: this.totalStars });
    }

    // ------------------------------------------------------------------ loop

    update(time: number, delta: number): void {
        for (const slot of this.plots) {
            if (slot.state !== 'growing') continue;
            slot.progress += delta / slot.crop.growMs;
            if (slot.progress >= 1) {
                this.setPlotReady(slot);
            } else {
                this.refreshGrowthVisual(slot);
            }
        }

        for (const slot of this.animals) {
            if (slot.state !== 'producing' || slot.produceStartedAt === undefined) continue;
            const elapsed = time - slot.produceStartedAt;
            if (elapsed >= slot.def.produceMs) {
                this.setProductReady(slot);
            } else {
                slot.bar.setProgress(elapsed / slot.def.produceMs);
            }
        }
    }

    // -------------------------------------------------------------- layout

    private handleResize(): void {
        const { width, height } = this.scale;

        const scale = Math.min(width / REF_W, height / REF_H);
        this.group.setScale(scale);
        this.group.setPosition(width / 2, height / 2);

        this.starText.setPosition(20, 16);
        this.doneButton.setPosition(width - 76, 48);

        this.skyBg.setDisplaySize(width, height);
        this.ground.setSize(width, height * 0.62).setPosition(width / 2, height * 0.69);
        this.sun.setPosition(width - 60, 70);
        this.clouds.forEach((cloud, i) => {
            cloud.setPosition(width * [0.2, 0.75, 0.45][i], height * [0.1, 0.16, 0.05][i]);
        });
    }

    shutdown(): void {
        this.scale.off('resize', this.handleResize, this);
    }
}
