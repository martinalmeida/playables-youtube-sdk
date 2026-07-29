/**
 * DebugOverlay.ts — FPS + estado del SDK, SOLO para desarrollo
 * (`import.meta.env.DEV`). Nunca debe activarse en producción.
 */
import type Phaser from 'phaser';
import { YouTubePlayables } from '../lib/YouTubePlayables';

export function attachDebugOverlay(scene: Phaser.Scene): Phaser.GameObjects.Text {
    const text = scene.add
        .text(8, 8, '', {
            fontFamily: 'monospace',
            fontSize: '14px',
            color: '#00ff88',
            backgroundColor: '#000000aa',
            padding: { x: 6, y: 4 }
        })
        .setDepth(9999)
        .setScrollFactor(0);

    scene.events.on('postupdate', () => {
        const fps = Math.round(scene.game.loop.actualFps);
        const sdk = YouTubePlayables.sdkAvailable() ? 'OK' : 'no detectado (standalone)';
        const audio = YouTubePlayables.isAudioEnabled() ? 'on' : 'muted';
        text.setText(`FPS: ${fps}\nSDK: ${sdk}\nAudio: ${audio}`);
    });

    return text;
}
