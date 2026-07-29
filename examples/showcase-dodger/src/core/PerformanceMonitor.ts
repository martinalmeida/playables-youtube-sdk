/**
 * PerformanceMonitor.ts — mide FPS en una ventana móvil y expone un nivel
 * de calidad ('high'|'medium'|'low') vía EventBus para que el gameplay
 * reduzca partículas/efectos en dispositivos de gama baja. Crítico en
 * Playables: corre en móviles variados sin control sobre el hardware.
 *
 * Uso:
 *   import { PerformanceMonitor } from '../core/PerformanceMonitor';
 *   PerformanceMonitor.attach(this); // una vez, en Boot o en la escena principal
 *   EventBus.on('performance:qualitychange', (level) => { ... reduce efectos ... });
 *   PerformanceMonitor.quality; // 'high' | 'medium' | 'low', consulta directa
 */
import type Phaser from 'phaser';
import { EventBus } from './EventBus';

export type QualityLevel = 'high' | 'medium' | 'low';

const WINDOW_SIZE = 60; // frames
const LOW_THRESHOLD_FPS = 30;
const MEDIUM_THRESHOLD_FPS = 50;

class PerformanceMonitorImpl {
    private samples: number[] = [];
    private currentQuality: QualityLevel = 'high';

    get quality(): QualityLevel {
        return this.currentQuality;
    }

    attach(scene: Phaser.Scene): void {
        scene.events.on('postupdate', () => {
            this.samples.push(scene.game.loop.actualFps);
            if (this.samples.length > WINDOW_SIZE) this.samples.shift();

            if (this.samples.length >= WINDOW_SIZE) {
                this.evaluate();
            }
        });
    }

    private evaluate(): void {
        const avg = this.samples.reduce((sum, v) => sum + v, 0) / this.samples.length;
        const next: QualityLevel = avg < LOW_THRESHOLD_FPS ? 'low' : avg < MEDIUM_THRESHOLD_FPS ? 'medium' : 'high';

        if (next !== this.currentQuality) {
            this.currentQuality = next;
            EventBus.emit('performance:qualitychange', next);
        }
    }
}

export const PerformanceMonitor = new PerformanceMonitorImpl();
export default PerformanceMonitor;
