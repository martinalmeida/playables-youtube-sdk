/**
 * ShapeSprites.ts — generador procedural de texturas simples (círculo,
 * estrella, polígono, gradiente) vía Canvas 2D, registradas como textura de
 * Phaser. Mismo motivo que SfxSynth.ts: un agente no tiene forma de
 * conseguir arte real, así que esto da placeholders decentes (y a veces
 * suficientes para el juego final) sin depender de archivos externos.
 *
 * Uso:
 *   import { ShapeSprites } from '../core/ShapeSprites';
 *   ShapeSprites.circle(this, 'ball', { radius: 24, color: 0x5b8cff });
 *   this.add.image(x, y, 'ball');
 */
import type Phaser from 'phaser';

function ensureCanvasTexture(scene: Phaser.Scene, key: string, size: number): Phaser.Textures.CanvasTexture {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    return scene.textures.createCanvas(key, size, size)!;
}

function colorToCss(color: number, alpha = 1): string {
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export interface CircleOptions {
    radius?: number;
    color?: number;
    strokeColor?: number;
    strokeWidth?: number;
}

export interface StarOptions {
    radius?: number;
    innerRadius?: number;
    points?: number;
    color?: number;
}

export interface GradientOptions {
    width?: number;
    height?: number;
    colorStart?: number;
    colorEnd?: number;
    direction?: 'vertical' | 'horizontal';
}

class ShapeSpritesImpl {
    circle(scene: Phaser.Scene, key: string, options: CircleOptions = {}): void {
        const { radius = 16, color = 0xffffff, strokeColor, strokeWidth = 0 } = options;
        const size = (radius + strokeWidth) * 2;
        const canvasTexture = ensureCanvasTexture(scene, key, size);
        const ctx = canvasTexture.getContext();

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
        ctx.fillStyle = colorToCss(color);
        ctx.fill();

        if (strokeColor !== undefined && strokeWidth > 0) {
            ctx.lineWidth = strokeWidth;
            ctx.strokeStyle = colorToCss(strokeColor);
            ctx.stroke();
        }

        canvasTexture.refresh();
    }

    star(scene: Phaser.Scene, key: string, options: StarOptions = {}): void {
        const { radius = 20, innerRadius = radius * 0.45, points = 5, color = 0xffd166 } = options;
        const size = radius * 2 + 4;
        const canvasTexture = ensureCanvasTexture(scene, key, size);
        const ctx = canvasTexture.getContext();
        const cx = size / 2;
        const cy = size / 2;
        const step = Math.PI / points;

        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const r = i % 2 === 0 ? radius : innerRadius;
            const angle = i * step - Math.PI / 2;
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = colorToCss(color);
        ctx.fill();

        canvasTexture.refresh();
    }

    /** Rectángulo con gradiente lineal — útil para fondos rápidos sin assets. */
    gradientRect(scene: Phaser.Scene, key: string, options: GradientOptions = {}): void {
        const {
            width = 256,
            height = 256,
            colorStart = 0x1a2130,
            colorEnd = 0x0b0e14,
            direction = 'vertical'
        } = options;

        if (scene.textures.exists(key)) scene.textures.remove(key);
        const canvasTexture = scene.textures.createCanvas(key, width, height)!;
        const ctx = canvasTexture.getContext();

        const gradient =
            direction === 'vertical'
                ? ctx.createLinearGradient(0, 0, 0, height)
                : ctx.createLinearGradient(0, 0, width, 0);

        gradient.addColorStop(0, colorToCss(colorStart));
        gradient.addColorStop(1, colorToCss(colorEnd));

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        canvasTexture.refresh();
    }

    /** Textura de 2x2px de un color sólido — base ideal para partículas (ver ParticlePresets.ts). */
    dot(scene: Phaser.Scene, key: string, color = 0xffffff): void {
        if (scene.textures.exists(key)) scene.textures.remove(key);
        const canvasTexture = scene.textures.createCanvas(key, 4, 4)!;
        const ctx = canvasTexture.getContext();
        ctx.fillStyle = colorToCss(color);
        ctx.fillRect(0, 0, 4, 4);
        canvasTexture.refresh();
    }
}

export const ShapeSprites = new ShapeSpritesImpl();
export default ShapeSprites;
