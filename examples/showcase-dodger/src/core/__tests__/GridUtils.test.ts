import { describe, it, expect } from 'vitest';
import { gridToWorld, worldToGrid, getNeighbors4, getNeighbors8, findPathBFS } from '../GridUtils';

describe('GridUtils', () => {
    it('gridToWorld() centra la coordenada dentro de la celda', () => {
        const { x, y } = gridToWorld(2, 3, { cellSize: 64, originX: 100, originY: 100 });
        expect(x).toBe(100 + 2 * 64 + 32);
        expect(y).toBe(100 + 3 * 64 + 32);
    });

    it('worldToGrid() es el inverso de gridToWorld()', () => {
        const world = gridToWorld(2, 3, { cellSize: 64, originX: 100, originY: 100 });
        const grid = worldToGrid(world.x, world.y, { cellSize: 64, originX: 100, originY: 100 });
        expect(grid).toEqual({ col: 2, row: 3 });
    });

    it('getNeighbors4() descarta vecinos fuera del grid', () => {
        const neighbors = getNeighbors4({ col: 0, row: 0 }, 3, 3);
        expect(neighbors).toEqual(
            expect.arrayContaining([
                { col: 0, row: 1 },
                { col: 1, row: 0 }
            ])
        );
        expect(neighbors).toHaveLength(2); // arriba e izquierda quedan fuera
    });

    it('getNeighbors8() incluye diagonales', () => {
        const neighbors = getNeighbors8({ col: 1, row: 1 }, 3, 3);
        expect(neighbors).toHaveLength(8);
    });

    it('findPathBFS() encuentra el camino más corto en un grid abierto', () => {
        const path = findPathBFS({ col: 0, row: 0 }, { col: 2, row: 0 }, 3, 1, () => true);
        expect(path).toEqual([
            { col: 0, row: 0 },
            { col: 1, row: 0 },
            { col: 2, row: 0 }
        ]);
    });

    it('findPathBFS() devuelve null si no hay camino posible', () => {
        const isWalkable = (c: { col: number; row: number }) => !(c.col === 1);
        const path = findPathBFS({ col: 0, row: 0 }, { col: 2, row: 0 }, 3, 1, isWalkable);
        expect(path).toBeNull();
    });
});
