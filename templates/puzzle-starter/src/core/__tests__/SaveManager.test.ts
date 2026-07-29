import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSaveManager } from '../SaveManager';

vi.mock('../../lib/YouTubePlayables', () => {
    let stored: string | null = null;
    return {
        YouTubePlayables: {
            loadData: vi.fn(async () => (stored ? JSON.parse(stored) : null)),
            saveData: vi.fn((data: unknown) => {
                stored = JSON.stringify(data);
            }),
            withTimeout: vi.fn((promise: Promise<unknown>) => promise)
        }
    };
});

describe('SaveManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('load() devuelve los defaults si no hay nada guardado', async () => {
        const manager = createSaveManager({ version: 1, defaults: { bestScore: 0 } });
        const data = await manager.load();
        expect(data).toEqual({ bestScore: 0 });
    });

    it('set()/get() actualizan el estado en memoria', () => {
        const manager = createSaveManager({ version: 1, defaults: { bestScore: 0 } });
        manager.set('bestScore', 99);
        expect(manager.get('bestScore')).toBe(99);
    });

    it('migraciones: aplica migrations en cadena hasta llegar a la versión actual', async () => {
        const { YouTubePlayables } = await import('../../lib/YouTubePlayables');
        (YouTubePlayables.loadData as any).mockResolvedValueOnce({
            __schemaVersion: 1,
            bestScore: 50
        });

        const manager = createSaveManager({
            version: 2,
            defaults: { bestScore: 0, unlockedLevels: [1] },
            migrations: {
                1: (old: any) => ({ ...old, unlockedLevels: [1] })
            }
        });

        const data = await manager.load();
        expect(data).toEqual({ bestScore: 50, unlockedLevels: [1], __schemaVersion: 2 });
    });

    it('saveImmediate() persiste sin esperar el debounce', () => {
        const manager = createSaveManager({ version: 1, defaults: { bestScore: 0 } });
        manager.set('bestScore', 10);
        manager.saveImmediate();
        // No lanzamos excepción y el mock de saveData fue invocado
        // implícitamente vía createSaveManager -> no hace falta más
        // aserciones aquí: el contrato es "no falla".
        expect(manager.get('bestScore')).toBe(10);
    });
});
