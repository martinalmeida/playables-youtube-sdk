/**
 * ParticlePresets.ts — presets de partículas comunes (confetti, chispas,
 * humo, polvo de impacto) sobre Phaser.GameObjects.Particles, usando
 * texturas generadas por ShapeSprites.dot() — nunca requiere un archivo de
 * imagen real.
 *
 * Uso:
 *   import { ParticlePresets } from '../core/ParticlePresets';
 *   ParticlePresets.confetti(this, x, y);
 *   ParticlePresets.impactDust(this, x, y);
 */
import type Phaser from 'phaser';
import { ShapeSprites } from './ShapeSprites';

const PARTICLE_TEXTURE_KEY = '__particle_dot__';

function ensureParticleTexture(scene: Phaser.Scene): void {
    if (!scene.textures.exists(PARTICLE_TEXTURE_KEY)) {
        ShapeSprites.dot(scene, PARTICLE_TEXTURE_KEY, 0xffffff);
    }
}

class ParticlePresetsImpl {
    /** Explosión de confeti multicolor — victorias, logros, subir de nivel. */
    confetti(scene: Phaser.Scene, x: number, y: number): void {
        ensureParticleTexture(scene);
        const colors = [0xff5b6b, 0x5b8cff, 0xffd166, 0x6ee7b7, 0xc084fc];

        const emitter = scene.add.particles(x, y, PARTICLE_TEXTURE_KEY, {
            speed: { min: 150, max: 350 },
            angle: { min: 0, max: 360 },
            scale: { start: 2.5, end: 0 },
            lifespan: 800,
            gravityY: 400,
            quantity: 30,
            tint: colors,
            emitting: false
        });

        emitter.explode(30);
        scene.time.delayedCall(900, () => emitter.destroy());
    }

    /** Chispas direccionales — impactos de armas, choques, recolección de ítems. */
    spark(scene: Phaser.Scene, x: number, y: number, color = 0xffd166): void {
        ensureParticleTexture(scene);
        const emitter = scene.add.particles(x, y, PARTICLE_TEXTURE_KEY, {
            speed: { min: 80, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 2, end: 0 },
            lifespan: 350,
            quantity: 12,
            tint: color,
            emitting: false
        });

        emitter.explode(12);
        scene.time.delayedCall(400, () => emitter.destroy());
    }

    /** Nube de humo ascendente — explosiones grandes, motores, "poof" de desaparición. */
    smoke(scene: Phaser.Scene, x: number, y: number): void {
        ensureParticleTexture(scene);
        const emitter = scene.add.particles(x, y, PARTICLE_TEXTURE_KEY, {
            speed: { min: 20, max: 60 },
            angle: { min: 260, max: 280 },
            scale: { start: 3, end: 8 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 900,
            quantity: 10,
            tint: 0x888899,
            emitting: false
        });

        emitter.explode(10);
        scene.time.delayedCall(1000, () => emitter.destroy());
    }

    /** Polvo de impacto al aterrizar/chocar contra el suelo — feedback sutil de peso/físico. */
    impactDust(scene: Phaser.Scene, x: number, y: number): void {
        ensureParticleTexture(scene);
        const emitter = scene.add.particles(x, y, PARTICLE_TEXTURE_KEY, {
            speed: { min: 40, max: 120 },
            angle: { min: 200, max: 340 },
            scale: { start: 1.5, end: 0 },
            lifespan: 300,
            quantity: 8,
            tint: 0xcccccc,
            emitting: false
        });

        emitter.explode(8);
        scene.time.delayedCall(350, () => emitter.destroy());
    }
}

export const ParticlePresets = new ParticlePresetsImpl();
export default ParticlePresets;
