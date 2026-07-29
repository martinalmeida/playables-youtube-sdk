import Phaser from 'phaser';
import { fadeToScene, fadeInScene } from '../core/SceneTransitions';
import { popScale, floatingText } from '../core/Juice';
import { createStateMachine } from '../core/StateMachine';
import { loadLevel } from '../core/LevelLoader';

/**
 * Game (puzzle): juego de memoria/parejas data-driven.
 *
 * Demuestra:
 *  - LevelLoader: la disposición del grid y los colores vienen de un JSON
 *    (public/levels/level-1.json), no hardcodeados en el código.
 *  - StateMachine: controla el flujo 'esperando primer tile' ->
 *    'esperando segundo tile' -> 'comparando' -> vuelta a esperar.
 *  - Juice: popScale al acertar, floatingText con el puntaje.
 *
 * NOTA sobre input: aquí cada tile es su propio GameObject interactivo de
 * Phaser (setInteractive + pointerdown), en vez de usar InputManager. Para
 * UI de grid con hit-testing por celda, es más directo que la capa de
 * gestos genérica — ver SKILLS/core-libraries/SKILL.md ("no lo uses para...
 * UI muy específica de un juego").
 */
interface LevelConfig {
    id: string;
    gridCols: number;
    gridRows: number;
    colors: number[];
}

interface Tile {
    rect: Phaser.GameObjects.Rectangle;
    color: number;
    revealed: boolean;
    matched: boolean;
}

export class Game extends Phaser.Scene {
    private tiles: Tile[] = [];
    private picked: Tile[] = [];
    private matchesFound = 0;
    private totalPairs = 0;
    private fsm = createStateMachine<'waitingFirst' | 'waitingSecond' | 'checking'>({
        initial: 'waitingFirst',
        states: {
            waitingFirst: { on: { pick: 'waitingSecond' } },
            waitingSecond: { on: { pick: 'checking' } },
            checking: { on: { resolved: 'waitingFirst' } }
        }
    });

    constructor() {
        super('Game');
    }

    async create(): Promise<void> {
        fadeInScene(this);

        const level = await loadLevel<LevelConfig>('levels/level-1.json', ['gridCols', 'gridRows', 'colors']);
        this.buildGrid(level);
    }

    private buildGrid(level: LevelConfig): void {
        const { gridCols, gridRows, colors } = level;
        const totalTiles = gridCols * gridRows;
        this.totalPairs = totalTiles / 2;

        // Duplicar colores para formar parejas y barajar (Fisher-Yates).
        const pairColors = colors.slice(0, this.totalPairs);
        const deck = [...pairColors, ...pairColors];
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        const { width, height } = this.scale;
        const margin = 16;
        const cellW = Math.min(120, (width - margin * (gridCols + 1)) / gridCols);
        const cellH = Math.min(120, (height - margin * (gridRows + 1)) / gridRows);
        const gridW = cellW * gridCols + margin * (gridCols - 1);
        const gridH = cellH * gridRows + margin * (gridRows - 1);
        const startX = width / 2 - gridW / 2 + cellW / 2;
        const startY = height / 2 - gridH / 2 + cellH / 2;

        deck.forEach((color, index) => {
            const col = index % gridCols;
            const row = Math.floor(index / gridCols);
            const x = startX + col * (cellW + margin);
            const y = startY + row * (cellH + margin);

            const rect = this.add
                .rectangle(x, y, cellW, cellH, 0x222833)
                .setStrokeStyle(2, 0x5b8cff)
                .setInteractive({ useHandCursor: true });

            const tile: Tile = { rect, color, revealed: false, matched: false };
            rect.on('pointerup', () => this.onTileTapped(tile));
            this.tiles.push(tile);
        });
    }

    private onTileTapped(tile: Tile): void {
        if (tile.matched || tile.revealed) return;
        if (this.fsm.is('checking')) return;

        this.revealTile(tile);
        this.picked.push(tile);
        this.fsm.send('pick');

        if (this.fsm.is('checking')) {
            this.time.delayedCall(500, () => this.checkMatch());
        }
    }

    private revealTile(tile: Tile): void {
        tile.revealed = true;
        tile.rect.setFillStyle(tile.color);
        popScale(this, tile.rect, 1.08);
    }

    private hideTile(tile: Tile): void {
        tile.revealed = false;
        tile.rect.setFillStyle(0x222833);
    }

    private checkMatch(): void {
        const [a, b] = this.picked;

        if (a.color === b.color) {
            a.matched = true;
            b.matched = true;
            this.matchesFound += 1;
            floatingText(this, a.rect.x, a.rect.y, '¡Pareja!', { color: '#5b8cff' });

            if (this.matchesFound >= this.totalPairs) {
                fadeToScene(this, 'GameOver', { score: this.matchesFound });
            }
        } else {
            this.hideTile(a);
            this.hideTile(b);
        }

        this.picked = [];
        this.fsm.send('resolved');
    }
}
