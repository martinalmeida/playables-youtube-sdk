import { describe, it, expect, vi, afterEach } from 'vitest';
import { warnIfBelowMinTouchTarget, MIN_TOUCH_TARGET_PX, A11Y_PALETTE } from '../Accessibility';

describe('Accessibility', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('advierte si el tamaño está por debajo del mínimo táctil', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        warnIfBelowMinTouchTarget(20, 20, 'botón de prueba');
        expect(warnSpy).toHaveBeenCalledOnce();
    });

    it('no advierte si el tamaño cumple el mínimo', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        warnIfBelowMinTouchTarget(MIN_TOUCH_TARGET_PX, MIN_TOUCH_TARGET_PX);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it('la paleta A11Y no usa la combinación clásica rojo/verde para éxito/error', () => {
        expect(A11Y_PALETTE.success).not.toBe(0x00ff00);
        expect(A11Y_PALETTE.error).not.toBe(0xff0000);
    });
});
