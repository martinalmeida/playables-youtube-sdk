/**
 * ObjectPool.ts — pooling genérico para objetos efímeros (balas, partículas,
 * enemigos). Evita presión de GC en dispositivos móviles de gama baja.
 */
export interface ObjectPoolOptions<T> {
    factory: () => T;
    reset: (obj: T, ...args: any[]) => void;
    release: (obj: T) => void;
    initialSize?: number;
}

export interface ObjectPool<T> {
    acquire(...args: any[]): T;
    release(obj: T): void;
    releaseAll(): void;
    stats(): { idle: number; active: number };
}

export function createObjectPool<T>({
    factory,
    reset,
    release,
    initialSize = 0
}: ObjectPoolOptions<T>): ObjectPool<T> {
    const idle: T[] = [];
    const active = new Set<T>();

    for (let i = 0; i < initialSize; i++) {
        const obj = factory();
        release(obj);
        idle.push(obj);
    }

    function acquire(...resetArgs: any[]): T {
        const obj = idle.pop() ?? factory();
        reset(obj, ...resetArgs);
        active.add(obj);
        return obj;
    }

    function releaseObj(obj: T): void {
        if (!active.has(obj)) return;
        active.delete(obj);
        release(obj);
        idle.push(obj);
    }

    function releaseAll(): void {
        for (const obj of Array.from(active)) releaseObj(obj);
    }

    function stats() {
        return { idle: idle.length, active: active.size };
    }

    return { acquire, release: releaseObj, releaseAll, stats };
}
