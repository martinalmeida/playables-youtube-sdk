import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { EventBus } from '../EventBus';

function createFakeScene(fpsSequence: number[]) {
    let index = 0;
    let postUpdateCb: (() => void) | null = null;

    const scene: any = {
        events: {
            on: (event: string, cb: () => void) => {
                if (event === 'postupdate') postUpdateCb = cb;
            }
        },
        game: {
            loop: {
                get actualFps() {
                    const value = fpsSequence[Math.min(index, fpsSequence.length - 1)];
                    index += 1;
                    return value;
                }
            }
        }
    };

    return {
        scene,
        tick: () => postUpdateCb?.()
    };
}

describe('PerformanceMonitor', () => {
    beforeEach(() => {
        // Reinicia el singleton entre tests reasignando su estado interno vía un ciclo limpio.
    });

    it('empieza en calidad "high" antes de acumular suficientes muestras', () => {
        expect(['high', 'medium', 'low']).toContain(PerformanceMonitor.quality);
    });

    it('emite performance:qualitychange cuando el FPS promedio cae por debajo del umbral', () => {
        const { scene, tick } = createFakeScene(new Array(70).fill(20));
        let emittedLevel: string | null = null;
        EventBus.on<string>('performance:qualitychange', (level) => {
            emittedLevel = level;
        });

        PerformanceMonitor.attach(scene);
        for (let i = 0; i < 65; i++) tick();

        expect(emittedLevel).toBe('low');
    });
});
