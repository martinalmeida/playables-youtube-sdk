/**
 * UIKit.ts — componentes de UI reutilizables y responsivos, construidos
 * como Phaser.GameObjects.Container.
 */
import Phaser from 'phaser';

const PALETTE = {
    bg: 0x1a2130,
    bgHover: 0x232c40,
    accent: 0x5b8cff,
    text: '#ffffff'
};

export interface ButtonOptions {
    width?: number;
    height?: number;
    fontSize?: string;
}

export class Button extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Rectangle;
    private label: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number, label: string, options: ButtonOptions = {}) {
        super(scene, x, y);
        const { width = 220, height = 64, fontSize = '28px' } = options;

        this.bg = scene.add.rectangle(0, 0, width, height, PALETTE.bg).setStrokeStyle(2, PALETTE.accent);
        this.label = scene.add
            .text(0, 0, label, { fontFamily: 'sans-serif', fontSize, color: PALETTE.text })
            .setOrigin(0.5);

        this.add([this.bg, this.label]);
        this.setSize(width, height);
        this.bg.setInteractive({ useHandCursor: true });

        this.bg.on('pointerover', () => this.bg.setFillStyle(PALETTE.bgHover));
        this.bg.on('pointerout', () => this.bg.setFillStyle(PALETTE.bg));
        this.bg.on('pointerdown', () => this.setScale(0.96));
        this.bg.on('pointerup', () => {
            this.setScale(1);
            this.emit('pointerup');
        });

        scene.add.existing(this);
    }

    setLabel(text: string): void {
        this.label.setText(text);
    }
}

export class Panel extends Phaser.GameObjects.Container {
    private bg: Phaser.GameObjects.Rectangle;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        width: number,
        height: number,
        { fillColor = PALETTE.bg, alpha = 0.9 }: { fillColor?: number; alpha?: number } = {}
    ) {
        super(scene, x, y);
        this.bg = scene.add
            .rectangle(0, 0, width, height, fillColor, alpha)
            .setStrokeStyle(2, PALETTE.accent);
        this.add(this.bg);
        this.setSize(width, height);
        scene.add.existing(this);
    }
}

export class ProgressBar extends Phaser.GameObjects.Container {
    private track: Phaser.GameObjects.Rectangle;
    private fill: Phaser.GameObjects.Rectangle;
    private widthPx: number;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        {
            width = 200,
            height = 20,
            fillColor = PALETTE.accent
        }: { width?: number; height?: number; fillColor?: number } = {}
    ) {
        super(scene, x, y);
        this.widthPx = width;

        this.track = scene.add.rectangle(0, 0, width, height, 0x222833).setOrigin(0, 0.5);
        this.fill = scene.add.rectangle(0, 0, width, height, fillColor).setOrigin(0, 0.5);

        this.add([this.track, this.fill]);
        this.setSize(width, height);
        scene.add.existing(this);
    }

    setProgress(value: number): void {
        const clamped = Math.min(Math.max(value, 0), 1);
        this.fill.width = this.widthPx * clamped;
    }
}
