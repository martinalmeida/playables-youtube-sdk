import { describe, it, expect, vi } from 'vitest';
import { createStateMachine } from '../StateMachine';

describe('StateMachine', () => {
    it('inicia en el estado initial y llama a su onEnter', () => {
        const onEnter = vi.fn();
        const fsm = createStateMachine<'idle' | 'walking'>({
            initial: 'idle',
            states: { idle: { onEnter, on: { move: 'walking' } }, walking: {} }
        });
        expect(fsm.current).toBe('idle');
        expect(onEnter).toHaveBeenCalledOnce();
    });

    it('transiciona con send() cuando el evento es válido', () => {
        const fsm = createStateMachine<'idle' | 'walking'>({
            initial: 'idle',
            states: { idle: { on: { move: 'walking' } }, walking: { on: { stop: 'idle' } } }
        });
        const moved = fsm.send('move');
        expect(moved).toBe(true);
        expect(fsm.current).toBe('walking');
    });

    it('send() devuelve false si el evento no aplica al estado actual', () => {
        const fsm = createStateMachine<'idle' | 'walking'>({
            initial: 'idle',
            states: { idle: { on: { move: 'walking' } }, walking: {} }
        });
        const result = fsm.send('nonexistent');
        expect(result).toBe(false);
        expect(fsm.current).toBe('idle');
    });

    it('llama a onExit del estado anterior y onEnter del nuevo', () => {
        const onExitIdle = vi.fn();
        const onEnterWalking = vi.fn();
        const fsm = createStateMachine<'idle' | 'walking'>({
            initial: 'idle',
            states: {
                idle: { onExit: onExitIdle, on: { move: 'walking' } },
                walking: { onEnter: onEnterWalking }
            }
        });
        fsm.send('move');
        expect(onExitIdle).toHaveBeenCalledOnce();
        expect(onEnterWalking).toHaveBeenCalledOnce();
    });
});
