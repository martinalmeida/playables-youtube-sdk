import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../EventBus';

describe('EventBus', () => {
    it('emite y recibe eventos con el detail correcto', () => {
        const handler = vi.fn();
        EventBus.on('test:event', handler);
        EventBus.emit('test:event', { value: 42 });
        expect(handler).toHaveBeenCalledWith({ value: 42 });
        EventBus.off('test:event', handler);
    });

    it('once() solo se dispara una vez', () => {
        const handler = vi.fn();
        EventBus.once('test:once', handler);
        EventBus.emit('test:once', 1);
        EventBus.emit('test:once', 2);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(1);
    });

    it('off() detiene la recepción de eventos', () => {
        const handler = vi.fn();
        EventBus.on('test:off', handler);
        EventBus.off('test:off', handler);
        EventBus.emit('test:off', 'x');
        expect(handler).not.toHaveBeenCalled();
    });
});
