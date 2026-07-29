/**
 * Juice.ts — feedback visual que casi todo juego necesita y que un agente
 * suele olvidar: screen shake, hit-stop (freeze-frame de impacto) y texto
 * flotante de daño/puntos. "Game feel" barato pero de alto impacto.
 */
import type Phaser from 'phaser';

export function screenShake(scene: Phaser.Scene, durationMs = 150, intensity = 0.01): void {
    scene.cameras.main.shake(durationMs, intensity);
}

/**
 * Pausa brevemente el tiempo del juego (no la cámara) para dar sensación de
 * "impacto". Usar con moderación: 40-100ms es suficiente, más se siente como
 * lag.
 */
export function hitStop(scene: Phaser.Scene, durationMs = 60): void {
    scene.time.timeScale = 0.02;
    scene.time.delayedCall(durationMs, () => {
        scene.time.timeScale = 1;
    });
}

export interface FloatingTextOptions {
    color?: string;
    fontSize?: string;
    riseDistance?: number;
    durationMs?: number;
}

/**
 * Texto que aparece en (x, y), sube y se desvanece. Útil para puntos
 * ganados, daño recibido, combos, etc.
 */
export function floatingText(
    scene: Phaser.Scene,
    x: number,
    y: number,
    message: string,
    { color = '#ffffff', fontSize = '24px', riseDistance = 48, durationMs = 600 }: FloatingTextOptions = {}
): void {
    const text = scene.add
        .text(x, y, message, { fontFamily: 'sans-serif', fontSize, color })
        .setOrigin(0.5)
        .setDepth(9998);

    scene.tweens.add({
        targets: text,
        y: y - riseDistance,
        alpha: 0,
        duration: durationMs,
        ease: 'Cubic.easeOut',
        onComplete: () => text.destroy()
    });
}

/**
 * "Pop" de escala rápida (crece y vuelve a la normalidad) — feedback simple
 * para botones presionados, ítems recogidos, subida de nivel, etc.
 */
export function popScale(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.Components.Transform,
    scaleUp = 1.2,
    durationMs = 120
): void {
    const originalScaleX = (target as any).scaleX ?? 1;
    const originalScaleY = (target as any).scaleY ?? 1;

    scene.tweens.add({
        targets: target,
        scaleX: originalScaleX * scaleUp,
        scaleY: originalScaleY * scaleUp,
        duration: durationMs / 2,
        yoyo: true,
        ease: 'Sine.easeInOut'
    });
}
