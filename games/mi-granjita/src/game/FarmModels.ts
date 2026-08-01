/**
 * FarmModels.ts — definiciones data-driven de cultivos y animales de
 * "Mi Granjita". Específico de este juego (no vive en core/): los emojis
 * hacen de sprites para que el juego funcione sin archivos de imagen y sin
 * que los niños necesiten leer.
 */

export interface CropDefinition {
    id: string;
    seedEmoji: string;
    sproutEmoji: string;
    readyEmoji: string;
    /** Tiempo total de crecimiento (semilla → listo), en ms. */
    growMs: number;
    /** Cosechas totales acumuladas necesarias para desbloquear este cultivo. */
    unlockAtHarvests: number;
}

export const CROPS: CropDefinition[] = [
    {
        id: 'zanahoria',
        seedEmoji: '🌱',
        sproutEmoji: '🌿',
        readyEmoji: '🥕',
        growMs: 8000,
        unlockAtHarvests: 0
    },
    { id: 'maiz', seedEmoji: '🌱', sproutEmoji: '🌿', readyEmoji: '🌽', growMs: 10000, unlockAtHarvests: 5 },
    {
        id: 'tomate',
        seedEmoji: '🌱',
        sproutEmoji: '🌿',
        readyEmoji: '🍅',
        growMs: 12000,
        unlockAtHarvests: 12
    },
    {
        id: 'fresa',
        seedEmoji: '🌱',
        sproutEmoji: '🌿',
        readyEmoji: '🍓',
        growMs: 14000,
        unlockAtHarvests: 20
    },
    {
        id: 'calabaza',
        seedEmoji: '🌱',
        sproutEmoji: '🌿',
        readyEmoji: '🎃',
        growMs: 16000,
        unlockAtHarvests: 30
    },
    {
        id: 'manzana',
        seedEmoji: '🌱',
        sproutEmoji: '🌿',
        readyEmoji: '🍎',
        growMs: 18000,
        unlockAtHarvests: 45
    }
];

/** Progreso (0-1) que un riego (tap en planta creciendo) adelanta del total. */
export const WATER_BOOST_FRACTION = 0.45;

export interface AnimalDefinition {
    id: string;
    emoji: string;
    /** Ítem que produce después de comer. */
    productEmoji: string;
    /** Tiempo en estar contento antes de volver a tener hambre, en ms. */
    hungryAfterMs: number;
    /** Tiempo en producir el ítem tras comer, en ms. */
    produceMs: number;
}

export const ANIMALS: AnimalDefinition[] = [
    { id: 'gallina', emoji: '🐔', productEmoji: '🥚', hungryAfterMs: 22000, produceMs: 6000 },
    { id: 'vaca', emoji: '🐮', productEmoji: '🥛', hungryAfterMs: 26000, produceMs: 8000 },
    { id: 'cerdo', emoji: '🐷', productEmoji: '🍄', hungryAfterMs: 30000, produceMs: 10000 },
    { id: 'oveja', emoji: '🐑', productEmoji: '🧶', hungryAfterMs: 34000, produceMs: 12000 }
];
