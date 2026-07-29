/**
 * LevelLoader.ts — carga y valida configuración de niveles data-driven
 * (JSON). Permite que un agente (o un diseñador) genere/edite contenido de
 * niveles sin tocar código de gameplay.
 *
 * Convención: los niveles viven en public/levels/<n>.json o se importan
 * como módulo JSON desde src/levels/. La forma exacta del esquema depende
 * del juego — este loader solo garantiza: existe, es JSON válido, y tiene
 * los campos mínimos declarados en `requiredFields`.
 *
 * Uso:
 *   import { loadLevel } from '../core/LevelLoader';
 *   const level = await loadLevel('levels/level-1.json', ['grid', 'timeLimit']);
 */
export async function loadLevel<T = Record<string, unknown>>(
    url: string,
    requiredFields: string[] = []
): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`[LevelLoader] No se pudo cargar "${url}": HTTP ${response.status}`);
    }

    const data = (await response.json()) as T;

    for (const field of requiredFields) {
        if (!(field in (data as Record<string, unknown>))) {
            throw new Error(`[LevelLoader] "${url}" no tiene el campo requerido "${field}"`);
        }
    }

    return data;
}

/**
 * Valida un array de niveles (ej. al iniciar el juego, para detectar
 * niveles rotos antes de que el jugador llegue a ellos) sin cargarlos vía
 * fetch — útil si los niveles se importan como módulos JSON en build time.
 */
export function validateLevels<T extends Record<string, unknown>>(
    levels: T[],
    requiredFields: string[]
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    levels.forEach((level, index) => {
        for (const field of requiredFields) {
            if (!(field in level)) {
                errors.push(`Nivel ${index}: falta el campo "${field}"`);
            }
        }
    });

    return { valid: errors.length === 0, errors };
}
