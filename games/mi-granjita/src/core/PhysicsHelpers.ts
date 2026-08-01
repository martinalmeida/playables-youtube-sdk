/**
 * PhysicsHelpers.ts — patrones comunes sobre Arcade Physics (el motor de
 * físicas simple incluido en Phaser, sin necesidad de Matter.js) para
 * géneros que el resto del SDK no cubre explícitamente: plataformeros,
 * lanzamiento de proyectiles (tipo Angry Birds), y movimiento con
 * aceleración/fricción.
 *
 * Requiere que la escena tenga Arcade Physics habilitado. En Phaser 3 esto
 * es automático para cualquier GameObject creado con `this.physics.add.*`
 * — no hace falta configurar nada extra en Phaser.Game si usas ese método
 * en vez de `this.add.*`.
 *
 * Uso:
 *   import { PhysicsHelpers } from '../core/PhysicsHelpers';
 *   const player = this.physics.add.sprite(x, y, 'player');
 *   PhysicsHelpers.setupPlatformerBody(player, { gravity: 900 });
 *
 *   const angle = PhysicsHelpers.angleBetween(slingshot, pointer);
 *   const { vx, vy } = PhysicsHelpers.velocityFromAngle(angle, power);
 *   projectile.setVelocity(vx, vy);
 */
import type Phaser from 'phaser';

export interface PlatformerBodyOptions {
    gravity?: number;
    maxVelocityX?: number;
    maxVelocityY?: number;
    bounce?: number;
    dragX?: number;
}

/**
 * Configura un cuerpo Arcade típico de plataformero: gravedad, límites de
 * velocidad, fricción horizontal (drag) para que el personaje no resbale
 * infinitamente al soltar el input.
 */
export function setupPlatformerBody(
    sprite: Phaser.Physics.Arcade.Sprite | Phaser.Physics.Arcade.Image,
    options: PlatformerBodyOptions = {}
): void {
    const { gravity = 900, maxVelocityX = 300, maxVelocityY = 900, bounce = 0, dragX = 800 } = options;
    const body = sprite.body as Phaser.Physics.Arcade.Body;

    body.setGravityY(gravity);
    body.setMaxVelocity(maxVelocityX, maxVelocityY);
    body.setBounce(bounce);
    body.setDragX(dragX);
    body.setCollideWorldBounds(true);
}

/** ¿El cuerpo está tocando el suelo? Útil para permitir saltar solo si aplica. */
export function isGrounded(sprite: Phaser.Physics.Arcade.Sprite | Phaser.Physics.Arcade.Image): boolean {
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
}

/** Convierte un ángulo (radianes) + potencia a componentes de velocidad — para lanzar proyectiles tipo slingshot. */
export function velocityFromAngle(angleRad: number, power: number): { vx: number; vy: number } {
    return {
        vx: Math.cos(angleRad) * power,
        vy: Math.sin(angleRad) * power
    };
}

/** Ángulo (radianes) desde un punto de origen hacia un puntero/objetivo — para apuntar. */
export function angleBetween(from: { x: number; y: number }, to: { x: number; y: number }): number {
    return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * Movimiento horizontal con aceleración suave (no instantáneo) — útil para
 * autos de carreras, personajes "pesados", o cualquier control que no deba
 * sentirse como teletransporte al soltar/presionar una dirección.
 */
export function applyHorizontalAcceleration(
    sprite: Phaser.Physics.Arcade.Sprite | Phaser.Physics.Arcade.Image,
    direction: -1 | 0 | 1,
    acceleration = 1200
): void {
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setAccelerationX(direction * acceleration);
}
