import { describe, it, expect, vi } from 'vitest';
import { loadLevel, validateLevels } from '../LevelLoader';

describe('LevelLoader', () => {
    it('loadLevel() devuelve el JSON parseado si la respuesta es ok', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({
                ok: true,
                json: async () => ({ gridCols: 4, gridRows: 3 })
            }))
        );

        const level = await loadLevel('levels/level-1.json', ['gridCols', 'gridRows']);
        expect(level).toEqual({ gridCols: 4, gridRows: 3 });
        vi.unstubAllGlobals();
    });

    it('loadLevel() lanza error si falta un campo requerido', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({
                ok: true,
                json: async () => ({ gridCols: 4 })
            }))
        );

        await expect(loadLevel('levels/level-1.json', ['gridCols', 'gridRows'])).rejects.toThrow(/gridRows/);
        vi.unstubAllGlobals();
    });

    it('loadLevel() lanza error si el fetch falla (HTTP no-ok)', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => ({ ok: false, status: 404 }))
        );
        await expect(loadLevel('levels/missing.json')).rejects.toThrow(/404/);
        vi.unstubAllGlobals();
    });

    it('validateLevels() reporta errores por nivel y campo', () => {
        const result = validateLevels(
            [{ gridCols: 4, gridRows: 3 }, { gridCols: 4 }],
            ['gridCols', 'gridRows']
        );
        expect(result.valid).toBe(false);
        expect(result.errors).toEqual(['Nivel 1: falta el campo "gridRows"']);
    });

    it('validateLevels() pasa si todos los niveles tienen los campos', () => {
        const result = validateLevels([{ gridCols: 4, gridRows: 3 }], ['gridCols', 'gridRows']);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
    });
});
