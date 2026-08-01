/**
 * GridUtils.ts — utilidades para juegos basados en grid/tablero: puzzles de
 * tiles, tower defense, juegos de mesa (tipo damas/ajedrez simplificado),
 * cualquier cosa con lógica de "casillas" en vez de física continua.
 *
 * Es agnóstico de Phaser: solo matemática de coordenadas + un
 * pathfinding BFS simple (suficiente para grids pequeños de un casual game;
 * para grids grandes con pesos variables, usar A* con una librería
 * dedicada).
 *
 * Uso:
 *   import { gridToWorld, worldToGrid, getNeighbors, findPathBFS } from '../core/GridUtils';
 *
 *   const { x, y } = gridToWorld(2, 3, { cellSize: 64, originX: 100, originY: 100 });
 *   const { col, row } = worldToGrid(pointerX, pointerY, { cellSize: 64, originX: 100, originY: 100 });
 *   const path = findPathBFS({ col: 0, row: 0 }, { col: 4, row: 4 }, cols, rows, isWalkable);
 */
export interface GridCoord {
    col: number;
    row: number;
}

export interface GridTransform {
    cellSize: number;
    originX?: number;
    originY?: number;
}

/** Convierte coordenadas de grid (columna, fila) a coordenadas de mundo (píxeles), centrado en la celda. */
export function gridToWorld(col: number, row: number, transform: GridTransform): { x: number; y: number } {
    const { cellSize, originX = 0, originY = 0 } = transform;
    return {
        x: originX + col * cellSize + cellSize / 2,
        y: originY + row * cellSize + cellSize / 2
    };
}

/** Convierte coordenadas de mundo (píxeles) a coordenadas de grid (columna, fila). */
export function worldToGrid(x: number, y: number, transform: GridTransform): GridCoord {
    const { cellSize, originX = 0, originY = 0 } = transform;
    return {
        col: Math.floor((x - originX) / cellSize),
        row: Math.floor((y - originY) / cellSize)
    };
}

/** Vecinos ortogonales (arriba/abajo/izquierda/derecha), filtrados a los que están dentro del grid. */
export function getNeighbors4(coord: GridCoord, cols: number, rows: number): GridCoord[] {
    const candidates: GridCoord[] = [
        { col: coord.col, row: coord.row - 1 },
        { col: coord.col, row: coord.row + 1 },
        { col: coord.col - 1, row: coord.row },
        { col: coord.col + 1, row: coord.row }
    ];
    return candidates.filter((c) => c.col >= 0 && c.col < cols && c.row >= 0 && c.row < rows);
}

/** Vecinos incluyendo diagonales (8-direccional). */
export function getNeighbors8(coord: GridCoord, cols: number, rows: number): GridCoord[] {
    const candidates: GridCoord[] = [];
    for (let dRow = -1; dRow <= 1; dRow++) {
        for (let dCol = -1; dCol <= 1; dCol++) {
            if (dRow === 0 && dCol === 0) continue;
            candidates.push({ col: coord.col + dCol, row: coord.row + dRow });
        }
    }
    return candidates.filter((c) => c.col >= 0 && c.col < cols && c.row >= 0 && c.row < rows);
}

function coordKey(c: GridCoord): string {
    return `${c.col},${c.row}`;
}

/**
 * BFS simple: camino más corto en un grid sin pesos (cada paso cuesta lo
 * mismo). Suficiente para la mayoría de juegos casuales de tiles. Devuelve
 * `null` si no hay camino.
 */
export function findPathBFS(
    start: GridCoord,
    goal: GridCoord,
    cols: number,
    rows: number,
    isWalkable: (coord: GridCoord) => boolean
): GridCoord[] | null {
    if (!isWalkable(start) || !isWalkable(goal)) return null;

    const visited = new Set<string>([coordKey(start)]);
    const cameFrom = new Map<string, GridCoord>();
    const queue: GridCoord[] = [start];

    while (queue.length > 0) {
        const current = queue.shift()!;

        if (current.col === goal.col && current.row === goal.row) {
            return reconstructPath(cameFrom, current, start);
        }

        for (const neighbor of getNeighbors4(current, cols, rows)) {
            const key = coordKey(neighbor);
            if (visited.has(key) || !isWalkable(neighbor)) continue;

            visited.add(key);
            cameFrom.set(key, current);
            queue.push(neighbor);
        }
    }

    return null;
}

function reconstructPath(
    cameFrom: Map<string, GridCoord>,
    current: GridCoord,
    start: GridCoord
): GridCoord[] {
    const path: GridCoord[] = [current];
    let node = current;

    while (!(node.col === start.col && node.row === start.row)) {
        const prev = cameFrom.get(coordKey(node));
        if (!prev) break;
        path.unshift(prev);
        node = prev;
    }

    return path;
}
