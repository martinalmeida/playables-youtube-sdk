import { describe, it, expect, vi } from 'vitest';
import { createObjectPool } from '../ObjectPool';

interface Dummy {
    x: number;
    active: boolean;
}

describe('ObjectPool', () => {
    it('crea initialSize objetos por adelantado', () => {
        const factory = vi.fn(() => ({ x: 0, active: false }) as Dummy);
        const pool = createObjectPool<Dummy>({
            factory,
            reset: (obj, x: number) => {
                obj.x = x;
                obj.active = true;
            },
            release: (obj) => {
                obj.active = false;
            },
            initialSize: 3
        });
        expect(factory).toHaveBeenCalledTimes(3);
        expect(pool.stats()).toEqual({ idle: 3, active: 0 });
    });

    it('acquire() reutiliza objetos idle en vez de crear nuevos', () => {
        const factory = vi.fn(() => ({ x: 0, active: false }) as Dummy);
        const pool = createObjectPool<Dummy>({
            factory,
            reset: (obj, x: number) => {
                obj.x = x;
            },
            release: () => {},
            initialSize: 1
        });
        const obj = pool.acquire(10);
        expect(obj.x).toBe(10);
        expect(factory).toHaveBeenCalledTimes(1);
        expect(pool.stats()).toEqual({ idle: 0, active: 1 });
    });

    it('release() devuelve el objeto al pool idle', () => {
        const pool = createObjectPool<Dummy>({
            factory: () => ({ x: 0, active: false }),
            reset: (obj, x: number) => {
                obj.x = x;
            },
            release: (obj) => {
                obj.active = false;
            },
            initialSize: 0
        });
        const obj = pool.acquire(5);
        pool.release(obj);
        expect(pool.stats()).toEqual({ idle: 1, active: 0 });
    });

    it('releaseAll() libera todos los objetos activos', () => {
        const pool = createObjectPool<Dummy>({
            factory: () => ({ x: 0, active: false }),
            reset: (obj, x: number) => {
                obj.x = x;
            },
            release: () => {},
            initialSize: 0
        });
        pool.acquire(1);
        pool.acquire(2);
        pool.releaseAll();
        expect(pool.stats()).toEqual({ idle: 2, active: 0 });
    });
});
