/**
 * SceneTransitions.ts — fade-in/fade-out entre escenas.
 */
import type Phaser from 'phaser';

export function fadeToScene(
    scene: Phaser.Scene,
    targetKey: string,
    data: Record<string, unknown> = {},
    durationMs = 250
): void {
    scene.cameras.main.fadeOut(durationMs, 0, 0, 0);
    scene.cameras.main.once('camerafadeoutcomplete', () => {
        scene.scene.start(targetKey, data);
    });
}

export function fadeInScene(scene: Phaser.Scene, durationMs = 250): void {
    scene.cameras.main.fadeIn(durationMs, 0, 0, 0);
}
