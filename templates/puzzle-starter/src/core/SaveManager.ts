/**
 * SaveManager.ts — guardado versionado con migraciones sobre YouTubePlayables.
 */
import { YouTubePlayables } from '../lib/YouTubePlayables';

export type Migration = (oldData: any) => any;

export interface SaveManagerOptions<T extends Record<string, any>> {
    version: number;
    defaults: T;
    migrations?: Record<number, Migration>;
    debounceMs?: number;
}

export interface SaveManager<T extends Record<string, any>> {
    load(): Promise<T>;
    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    getAll(): T;
    save(): void;
    saveImmediate(): void;
}

export function createSaveManager<T extends Record<string, any>>({
    version,
    defaults,
    migrations = {},
    debounceMs = 500
}: SaveManagerOptions<T>): SaveManager<T> {
    let state: T = { ...defaults };
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    async function load(): Promise<T> {
        let raw: (T & { __schemaVersion?: number }) | null = null;
        try {
            raw = await YouTubePlayables.withTimeout(
                YouTubePlayables.loadData<T & { __schemaVersion?: number }>(),
                1000
            );
        } catch (err) {
            console.error('[SaveManager] loadData falló, usando defaults:', err);
        }

        if (!raw) {
            state = { ...defaults };
            return state;
        }

        let migrated: any = raw;
        let fromVersion = raw.__schemaVersion ?? 1;

        while (fromVersion < version) {
            const migrateFn = migrations[fromVersion];
            if (!migrateFn) {
                console.warn(
                    `[SaveManager] No hay migración de v${fromVersion} a v${fromVersion + 1}. ` +
                        'Se usan los datos tal cual, cubiertos por defaults donde falten campos.'
                );
                break;
            }
            migrated = migrateFn(migrated);
            fromVersion += 1;
        }

        state = { ...defaults, ...migrated, __schemaVersion: version };
        return state;
    }

    function get<K extends keyof T>(key: K): T[K] {
        return state[key];
    }

    function set<K extends keyof T>(key: K, value: T[K]): void {
        state = { ...state, [key]: value };
    }

    function getAll(): T {
        return { ...state };
    }

    function save(): void {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            YouTubePlayables.saveData({ ...state, __schemaVersion: version });
        }, debounceMs);
    }

    function saveImmediate(): void {
        if (debounceTimer) clearTimeout(debounceTimer);
        YouTubePlayables.saveData({ ...state, __schemaVersion: version });
    }

    return { load, get, set, getAll, save, saveImmediate };
}
