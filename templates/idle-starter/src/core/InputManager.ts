/**
 * InputManager.ts — traduce eventos de puntero crudo de Phaser en gestos
 * semánticos (tap, hold, drag, swipe), emitidos por EventBus. Funciona igual
 * en mouse (desktop) y touch (móvil).
 */
import Phaser from 'phaser';
import { EventBus } from './EventBus';

const TAP_MAX_DISTANCE = 12;
const TAP_MAX_DURATION_MS = 250;
const HOLD_MS = 500;
const SWIPE_MIN_DISTANCE = 40;

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

class InputManagerImpl {
    private scene: Phaser.Scene | null = null;
    private pointerDownAt: number | null = null;
    private pointerDownPos: { x: number; y: number } | null = null;
    private lastPos: { x: number; y: number } | null = null;
    private isDragging = false;
    private holdTimer: ReturnType<typeof setTimeout> | null = null;

    attach(scene: Phaser.Scene): void {
        this.scene = scene;
        scene.input.on('pointerdown', this.onPointerDown, this);
        scene.input.on('pointermove', this.onPointerMove, this);
        scene.input.on('pointerup', this.onPointerUp, this);
        scene.events.once('shutdown', () => this.detach());
    }

    detach(): void {
        if (!this.scene) return;
        this.scene.input.off('pointerdown', this.onPointerDown, this);
        this.scene.input.off('pointermove', this.onPointerMove, this);
        this.scene.input.off('pointerup', this.onPointerUp, this);
        if (this.holdTimer) clearTimeout(this.holdTimer);
        this.scene = null;
    }

    private onPointerDown(pointer: Phaser.Input.Pointer): void {
        this.pointerDownAt = Date.now();
        this.pointerDownPos = { x: pointer.x, y: pointer.y };
        this.lastPos = { x: pointer.x, y: pointer.y };
        this.isDragging = false;

        this.holdTimer = setTimeout(() => {
            if (!this.isDragging) {
                EventBus.emit('input:hold', { x: pointer.x, y: pointer.y });
            }
        }, HOLD_MS);
    }

    private onPointerMove(pointer: Phaser.Input.Pointer): void {
        if (!this.pointerDownPos || !this.lastPos || !pointer.isDown) return;

        const dx = pointer.x - this.lastPos.x;
        const dy = pointer.y - this.lastPos.y;
        const distanceFromStart = Phaser.Math.Distance.Between(
            this.pointerDownPos.x,
            this.pointerDownPos.y,
            pointer.x,
            pointer.y
        );

        if (!this.isDragging && distanceFromStart > TAP_MAX_DISTANCE) {
            this.isDragging = true;
            if (this.holdTimer) clearTimeout(this.holdTimer);
            EventBus.emit('input:dragstart', { x: pointer.x, y: pointer.y });
        }

        if (this.isDragging) {
            EventBus.emit('input:drag', { x: pointer.x, y: pointer.y, dx, dy });
        }

        this.lastPos = { x: pointer.x, y: pointer.y };
    }

    private onPointerUp(pointer: Phaser.Input.Pointer): void {
        if (this.holdTimer) clearTimeout(this.holdTimer);
        if (!this.pointerDownPos || this.pointerDownAt === null) return;

        const duration = Date.now() - this.pointerDownAt;
        const distance = Phaser.Math.Distance.Between(
            this.pointerDownPos.x,
            this.pointerDownPos.y,
            pointer.x,
            pointer.y
        );

        if (this.isDragging) {
            EventBus.emit('input:dragend', { x: pointer.x, y: pointer.y });

            if (distance >= SWIPE_MIN_DISTANCE) {
                const dx = pointer.x - this.pointerDownPos.x;
                const dy = pointer.y - this.pointerDownPos.y;
                const direction: SwipeDirection =
                    Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';

                EventBus.emit('input:swipe', { direction, distance });
            }
        } else if (distance <= TAP_MAX_DISTANCE && duration <= TAP_MAX_DURATION_MS) {
            EventBus.emit('input:tap', { x: pointer.x, y: pointer.y });
        }

        this.pointerDownAt = null;
        this.pointerDownPos = null;
        this.isDragging = false;
    }
}

export const InputManager = new InputManagerImpl();
export default InputManager;
