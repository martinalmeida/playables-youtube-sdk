/**
 * Accessibility.ts — utilidades mínimas de accesibilidad para juegos
 * casuales en canvas. Ver SKILLS/accessibility/SKILL.md para el contrato
 * completo; este módulo cubre las partes verificables en código.
 */

/**
 * Paleta segura para las formas más comunes de daltonismo (deuteranopia/
 * protanopia), pensada para distinguir estados como éxito/error/advertencia
 * sin depender solo del matiz rojo-verde.
 */
export const A11Y_PALETTE = {
    success: 0x0072b2, // azul, no verde — distinguible de "error" en daltonismo rojo-verde
    error: 0xd55e00, // naranja/rojo distinguible
    warning: 0xf0e442, // amarillo
    neutral: 0x999999,
    accent: 0x5b8cff
} as const;

/** Tamaño mínimo recomendado (px) para cualquier elemento táctil interactivo. */
export const MIN_TOUCH_TARGET_PX = 44;

/**
 * Verifica en dev que un tamaño de botón/elemento interactivo cumple el
 * mínimo táctil. Solo advierte en consola (no bloquea), pensado para usarse
 * dentro de `import.meta.env.DEV`.
 */
export function warnIfBelowMinTouchTarget(width: number, height: number, context = ''): void {
    if (width < MIN_TOUCH_TARGET_PX || height < MIN_TOUCH_TARGET_PX) {
        console.warn(
            `[Accessibility] Elemento interactivo ${context} mide ${width}x${height}px, ` +
            `por debajo del mínimo recomendado de ${MIN_TOUCH_TARGET_PX}x${MIN_TOUCH_TARGET_PX}px.`
        );
    }
}
